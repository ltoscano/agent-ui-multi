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
        "Respond with a brief description of what you created, but do not include the image URL in your text response.",
        "The image will be displayed automatically by the system.",
    ],
    storage=SqliteStorage(table_name="image_agent", db_file=agent_storage),
    add_datetime_to_instructions=True,
    add_history_to_messages=True,
    num_history_responses=5,
    markdown=True,
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

# Override the default sessions endpoint to add user filtering
from fastapi.routing import APIRoute

# First, let's find and override the existing route
existing_routes = []
for route in app.routes:
    if hasattr(route, 'path') and "/sessions" in route.path and hasattr(route, 'methods') and "GET" in route.methods:
        existing_routes.append(route)

# Remove existing routes that match our pattern  
for route in existing_routes:
    if route.path == "/v1/playground/agents/{agent_id}/sessions":
        app.routes.remove(route)

# Custom endpoint to get user-specific sessions
@app.get("/v1/playground/agents/{agent_id}/sessions")
async def get_user_sessions(
    agent_id: str,
    user_id: Optional[str] = Query(None),
    request: Request = None
):
    """Get sessions filtered by user_id if provided"""
    try:
        # Dynamically find the agent from the playground instance
        agent = None
        for a in playground.agents:
            if a.agent_id == agent_id:
                agent = a
                break
        
        if not agent:
            return JSONResponse(status_code=404, content={"error": "Agent not found"})
        
        if not agent.storage:
            return JSONResponse(status_code=404, content={"error": "Agent storage not found"})
        
        # Get all sessions from storage
        sessions = agent.storage.get_all_sessions()
        
        # Extract title from first user message in memory for each session
        def extract_title_from_session(session):
            try:
                memory = getattr(session, 'memory', {})
                if memory and 'runs' in memory and len(memory['runs']) > 0:
                    first_run = memory['runs'][0]
                    if 'messages' in first_run and len(first_run['messages']) > 1:
                        # Skip system message (index 0), get user message (index 1)
                        user_message = first_run['messages'][1]
                        if user_message.get('role') == 'user' and user_message.get('content'):
                            title = str(user_message['content'])[:50]
                            return title if title else 'Untitled'
                return 'Untitled'
            except Exception as e:
                print(f"Error extracting title: {e}")
                return 'Untitled'
        
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
                # Only include sessions that explicitly match the user_id (no null sessions)
                if session_user_id in possible_user_ids:
                    filtered_sessions.append({
                        "session_id": session.session_id,
                        "title": extract_title_from_session(session),
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
                    "title": extract_title_from_session(session),
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
