from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.playground import Playground, serve_playground_app
from agno.storage.sqlite import SqliteStorage
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.tools.yfinance import YFinanceTools
from fastapi import Request, Query, Form
from fastapi.responses import JSONResponse, StreamingResponse
from agno.tools.dalle import DalleTools
from typing import Optional
import json

agent_storage: str = "tmp/agents.db"

web_agent = Agent(
    name="Web Agent",
    model=OpenAIChat(id="gpt-4o"),
    tools=[DuckDuckGoTools()],
    instructions=["Always include sources"],
    # Store the agent sessions in a sqlite database
    storage=SqliteStorage(table_name="web_agent", db_file=agent_storage),
    # Adds the current date and time to the instructions
    add_datetime_to_instructions=True,
    # Adds the history of the conversation to the messages
    add_history_to_messages=True,
    # Number of history responses to add to the messages
    num_history_responses=5,
    # Adds markdown formatting to the messages
    markdown=True,
)

finance_agent = Agent(
    name="Finance Agent",
    model=OpenAIChat(id="gpt-4o"),
    tools=[YFinanceTools(stock_price=True, analyst_recommendations=True, company_info=True, company_news=True)],
    instructions=["Always use tables to display data"],
    storage=SqliteStorage(table_name="finance_agent", db_file=agent_storage),
    add_datetime_to_instructions=True,
    add_history_to_messages=True,
    num_history_responses=5,
    markdown=True,
)

image_agent = Agent(
    name="Image Agent",
    model=OpenAIChat(id="gpt-4o"),
    tools=[DalleTools()],
    description="You are an AI agent that can create images using DALL-E.",
    instructions=[
        "When the user asks you to create an image, use the DALL-E tool to create an image.",
        "The DALL-E tool will return an image URL.",
        "Return the image URL in your response in the following format: `![image description](image URL)`",
    ],
    storage=SqliteStorage(table_name="image_agent", db_file=agent_storage),
    add_datetime_to_instructions=True,
    add_history_to_messages=True,
    num_history_responses=5,
    markdown=False,
)

# Create playground instance
playground = Playground(agents=[web_agent, finance_agent, image_agent])

# Get the FastAPI app
app = playground.get_app()

# Custom endpoint to handle agent runs with user_id
# @app.post("/v1/playground/agents/{agent_id}/runs")
# async def agent_run_with_user_id(
#     agent_id: str,
#     request: Request,
#     message: str = Form(...),
#     stream: Optional[str] = Form(None),
#     session_id: Optional[str] = Form(None),
#     user_id: Optional[str] = Form(None)
# ):
#     """Handle agent runs and ensure user_id is saved in session"""
#     # Temporarily disabled due to import issues
#     return JSONResponse(status_code=501, content={"error": "Endpoint disabled"})

# Custom endpoint to get user-specific sessions
@app.get("/v1/playground/agents/{agent_id}/sessions")
async def get_user_sessions(
    agent_id: str,
    user_id: Optional[str] = Query(None),
    request: Request = None
):
    """Get sessions filtered by user_id if provided"""
    try:
        # Find the agent
        agent = None
        for a in [web_agent, finance_agent]:
            if a.agent_id == agent_id:
                agent = a
                break
        
        if not agent or not agent.storage:
            return JSONResponse(status_code=404, content={"error": "Agent or storage not found"})
        
        # Get all sessions from storage
        sessions = agent.storage.get_all_sessions()
        
        # Filter by user_id if provided
        if user_id:
            # Map user_id to possible values in database
            # user_id '1' should match 'Lorenzo' in database (legacy)
            possible_user_ids = [user_id]
            if user_id == '1':
                possible_user_ids.append('Lorenzo')  # Legacy mapping
            elif user_id == 'Lorenzo':
                possible_user_ids.append('1')  # Reverse mapping
            
            filtered_sessions = []
            for session in sessions:
                session_user_id = getattr(session, 'user_id', None)
                if session_user_id in possible_user_ids:
                    filtered_sessions.append({
                        "session_id": session.session_id,
                        "title": getattr(session, 'title', 'Untitled'),
                        "created_at": getattr(session, 'created_at', 0),
                        "updated_at": getattr(session, 'updated_at', 0),
                        "user_id": session_user_id
                    })
            return filtered_sessions
        else:
            # Return all sessions if no user_id filter
            return [
                {
                    "session_id": session.session_id,
                    "title": getattr(session, 'title', 'Untitled'),
                    "created_at": getattr(session, 'created_at', 0),
                    "updated_at": getattr(session, 'updated_at', 0),
                    "user_id": getattr(session, 'user_id', None)
                }
                for session in sessions
            ]
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

if __name__ == "__main__":
    serve_playground_app("playground:app", reload=True)
