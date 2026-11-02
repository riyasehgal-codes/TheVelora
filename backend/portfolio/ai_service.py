
"""
Velora AI Chatbot Service

Connects Django to the locally running Ollama model.
Handles normal chatbot conversations.
"""

import json
import urllib.error
import urllib.request


OLLAMA_URL = "http://localhost:11434/api/chat"
OLLAMA_MODEL = "llama3.2:3b"


def generate_chat_response(messages):
    """
    Sends conversation messages to Ollama
    and returns the AI-generated response.
    """

    system_message = {
        "role": "system",
        "content": (
            "You are Velora AI, a friendly and helpful chatbot. "
            "Answer questions naturally and clearly. "
            "Use simple language whenever possible. "
            "You can discuss general topics, technology, education, "
            "finance, and everyday questions. "
            "Be polite, helpful, and conversational. "
            "Never pretend to know information you do not know."
        ),
    }

    # Keep only the latest 12 conversation messages.
    conversation = messages[-12:]

    payload = {
        "model": OLLAMA_MODEL,
        "messages": [system_message] + conversation,
        "stream": False,
        "options": {
            "temperature": 0.7,
            "num_predict": 500,
        },
    }

    request = urllib.request.Request(
        OLLAMA_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(
            request,
            timeout=120,
        ) as response:
            result = json.loads(
                response.read().decode("utf-8")
            )

        answer = result.get("message", {}).get("content", "").strip()

        if not answer:
            raise ValueError("The AI returned an empty response.")

        return answer

    except urllib.error.HTTPError as error:
        raise ValueError(
            f"Ollama returned HTTP error {error.code}."
        ) from error

    except urllib.error.URLError as error:
        raise ConnectionError(
            "Could not connect to Ollama. "
            "Make sure Ollama is running."
        ) from error

    except TimeoutError as error:
        raise TimeoutError(
            "The AI response took too long. Please try again."
        ) from error
