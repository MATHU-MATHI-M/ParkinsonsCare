from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.core.biomarkers import analyze_spiral_drawing
import random

app = FastAPI(title="ParkinsonCare AI Microservice", version="1.0.0")

# Enable CORS for frontend and Node backend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DrawingPoint(BaseModel):
    x: float
    y: float
    t: float

class SpiralRequest(BaseModel):
    points: List[DrawingPoint]
    center_x: Optional[float] = 250
    center_y: Optional[float] = 250

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = []

class VoiceRequest(BaseModel):
    paragraph: Optional[str] = ""
    duration_sec: Optional[float] = 10.0

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "ParkinsonCare AI Microservice",
        "endpoints": {
            "POST /api/analyze/spiral": "Analyze hand tracking coordinates",
            "POST /api/analyze/voice": "Extract speech rates and sound jitters",
            "POST /api/chat": "LLM Health Assistant and FAQ Expert"
        }
    }

@app.post("/api/analyze/spiral")
def analyze_spiral(req: SpiralRequest):
    try:
        # Convert Pydantic points to dictionaries
        points_list = [{"x": p.x, "y": p.y, "t": p.t} for p in req.points]
        results = analyze_spiral_drawing(points_list, req.center_x, req.center_y)

        # Calculate a Fine Motor Score out of 100
        # 100 - deviation (typically 10-30%) - (tremorIndex * 6) (typically 1-5)
        raw_score = 100 - results["deviation"] - (results["tremorIndex"] * 5)
        fine_motor_score = int(max(10, min(100, raw_score)))

        return {
            "success": True,
            "score": fine_motor_score,
            "metrics": {
                "deviation": results["deviation"],
                "tremorIndex": results["tremorIndex"],
                "smoothness": results["smoothness"]
            },
            "message": results["message"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze/voice")
def analyze_voice(req: VoiceRequest):
    """
    Mock speech acoustic analysis.
    In production, this processes uploaded wav files using Librosa.
    """
    # Generate realistic Parkinsonian speech metrics
    speech_rate = round(random.uniform(2.5, 4.2), 2)  # words per second
    pause_duration = round(random.uniform(0.8, 2.2), 2)  # seconds
    jitter = round(random.uniform(0.08, 0.28), 3)  # % local frequency variations
    shimmer = round(random.uniform(0.18, 0.42), 3)  # % amplitude variations
    pitch_variance = round(random.uniform(30.0, 65.0), 1)  # Hz pitch standard deviation

    # Calculate overall voice index
    # Elevated jitter and shimmer represent hoarseness or vocal tremors
    # Normal: Jitter < 0.12%, Shimmer < 0.25%
    voice_penalty = (jitter * 100) + (shimmer * 50) + (pause_duration * 10)
    voice_score = int(max(40, min(100, 100 - voice_penalty)))

    return {
        "success": True,
        "score": voice_score,
        "metrics": {
            "speechRate": speech_rate,
            "pauseDuration": pause_duration,
            "jitter": jitter,
            "shimmer": shimmer,
            "pitchVariance": pitch_variance
        }
    }

# Clinical Knowledge Base for Parkinson Chatbot
KNOWLEDGE_BASE = {
    "updrs": (
        "The Unified Parkinson's Disease Rating Scale (UPDRS) is the clinical gold standard "
        "used to follow the course of Parkinson's disease. It has four parts: "
        "1) Non-motor experiences of daily living, 2) Motor experiences of daily living, "
        "3) Motor examination, and 4) Motor complications. Our ParkinsonCare AI platform helps "
        "estimate scores relating to Part 1 (via our Daily Questionnaire) and Part 3 (via our "
        "Spiral Drawing tremor metrics and Game reflex logs)."
    ),
    "symptoms": (
        "Parkinson's symptoms are broadly classified into Motor and Non-Motor symptoms. "
        "Motor symptoms include tremors (resting shaking), bradykinesia (slowness of movement), "
        "muscle rigidity (stiffness), and postural instability (balance issues). "
        "Non-Motor symptoms include sleep disturbances, mood changes (anxiety, depression), "
        "fatigue, cognitive changes, and autonomic issues (constipation)."
    ),
    "tremor": (
        "Parkinsonian tremors typically occur at rest (resting tremor) and have a frequency "
        "of 4 to 6 Hertz (shakes per second). They often show a 'pill-rolling' motion. "
        "Our Spiral Drawing motor assessment tracks this by measuring high-frequency velocity changes "
        "between your draw points to compute a Tremor Index. If your index increases, it's a good "
        "sign to take a break or review your medication timing."
    ),
    "exercise": (
        "Physical exercise is a critical component of managing Parkinson's. Studies show it helps "
        "maintain neuroplasticity and improve balance and gait. Recommended exercises include: "
        "1) Aerobic activities (cycling, brisk walking), 2) Strength training, "
        "3) Flexibility and stretching (Yoga, Tai Chi), and 4) Cognitive-motor exercises (dancing, "
        "boxing drills). Always consult your physical therapist before starting a new routine."
    ),
    "medication": (
        "Medications for Parkinson's aim to increase dopamine levels in the brain. The gold "
        "standard is Levodopa (usually combined with Carbidopa, known as Sinemet), which the brain converts "
        "into dopamine. Other classes include Dopamine Agonists (e.g. Pramipexole), MAO-B Inhibitors "
        "(e.g. Rasagiline, Selegiline) which slow dopamine breakdown, and COMT Inhibitors. "
        "It is crucial to take these medications precisely on schedule to avoid 'off' periods."
    ),
    "nutrition": (
        "While there is no specific 'Parkinson's diet', certain habits support overall health. "
        "Eating a fiber-rich diet and drinking plenty of water helps alleviate constipation, a common "
        "non-motor symptom. Also, since protein can interfere with Levodopa absorption, your doctor "
        "might recommend taking your medication 30-60 minutes before meals."
    )
}

@app.post("/api/chat")
def chat(req: ChatRequest):
    msg = req.message.lower()
    
    # Simple semantic router simulating Llama 3.2 logic
    response_text = ""
    
    if "updrs" in msg or "scale" in msg or "rating" in msg:
        response_text = KNOWLEDGE_BASE["updrs"]
    elif "symptom" in msg or "sign" in msg or "stiff" in msg or "rigidity" in msg or "bradykinesia" in msg:
        response_text = KNOWLEDGE_BASE["symptoms"]
    elif "tremor" in msg or "shake" in msg or "shaking" in msg or "oscillation" in msg:
        response_text = KNOWLEDGE_BASE["tremor"]
    elif "exercise" in msg or "workout" in msg or "physio" in msg or "yoga" in msg or "tai chi" in msg:
        response_text = KNOWLEDGE_BASE["exercise"]
    elif "medication" in msg or "drug" in msg or "sinemet" in msg or "levodopa" in msg or "rasagiline" in msg:
        response_text = KNOWLEDGE_BASE["medication"]
    elif "diet" in msg or "food" in msg or "protein" in msg or "constipation" in msg or "nutrition" in msg:
        response_text = KNOWLEDGE_BASE["nutrition"]
    elif "hello" in msg or "hi " in msg or "hey" in msg:
        response_text = (
            "Hello! I am your ParkinsonCare AI Wellness Assistant. I can help explain your daily score trends, "
            "provide information on Parkinson's symptoms, exercises, medications, and general FAQs. How can I assist you today?"
        )
    else:
        # Generic response answering standard questions with clinical guidance
        response_text = (
            "I understand you are asking about your health condition. Parkinson's disease is highly unique for "
            "each individual, characterized by motor fluctuations (on/off times) and cognitive fatigue. "
            "Regular monitoring via our drawing challenges and game logs helps create a detailed dashboard for "
            "your neurologist. Let me know if you would like me to explain Parkinson's ratings (UPDRS), "
            "symptoms, exercise guidelines, or nutrition tips."
        )

    # Append standard clinical safety disclaimer
    disclaimer = (
        "\n\n*Disclaimer: I am an AI assistant and do not provide medical diagnoses, treatment prescriptions, "
        "or clinical orders. Please consult your physician or neurologist for medical decisions.*"
    )

    return {
        "success": True,
        "response": response_text + disclaimer
    }
