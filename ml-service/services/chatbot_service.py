import os
from groq import Groq

def generate_chat_response(message: str) -> str:
    # It will automatically use the GROQ_API_KEY environment variable if not passed
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    
    system_prompt = (
        "You are an experienced agricultural advisor helping small farmers in India. "
        "Provide advice on pest control, organic treatments, fertilizer recommendations, "
        "and irrigation suggestions. Keep your responses simple and farmer-friendly."
    )
    
    try:
        response = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": message
                }
            ],
            model="llama-3.3-70b-versatile",  # Using a reliable Groq model
            temperature=0.7,
            max_tokens=1024
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"I'm sorry, I couldn't generate a response at this time. Please try again later. (Error: {str(e)})"
