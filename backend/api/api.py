from dotenv import load_dotenv
import os
import time
from uuid import uuid4
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.pydantic_v1 import BaseModel, Field
from difflib import SequenceMatcher
from langchain_core.messages import HumanMessage, SystemMessage
from bs4 import BeautifulSoup
from markdown import markdown
from markdown import Markdown
from io import StringIO


def unmark_element(element, stream=None):
    if stream is None:
        stream = StringIO()
    if element.text:
        stream.write(element.text)
    for sub in element:
        unmark_element(sub, stream)
    if element.tail:
        stream.write(element.tail)
    return stream.getvalue()


# patching Markdown
Markdown.output_formats["plain"] = unmark_element
__md = Markdown(output_format="plain")
__md.stripTopLevelTags = False


def unmark(text):
    return __md.convert(text)
load_dotenv()

def highlight_changes(original_text, edited_text):
    matcher = SequenceMatcher(None, original_text, edited_text)
    output = []
    add_symbol = "@@"
    delete_symbol = "~~"
    for opcode, a0, a1, b0, b1 in matcher.get_opcodes():
        if opcode == 'equal':
            output.append(original_text[a0:a1])
        elif opcode == 'replace':
            output.append(f"[{delete_symbol}{original_text[a0:a1]}{delete_symbol} {add_symbol}{edited_text[b0:b1]}{add_symbol}]")
        elif opcode == 'delete':
            output.append(f"[{delete_symbol}{original_text[a0:a1]}{delete_symbol}]")
        elif opcode == 'insert':
            output.append(f"[{add_symbol}{edited_text[b0:b1]}{add_symbol}]")
    result = ''.join(output)
    return result

def optimize_prompt_education(text):
    token = len(text)/4
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0.3,
        timeout=None,
        max_retries=2,
    )
    system_prompt = "You are an LLM prompt engineer for enhancing academic questions. You will use prompting techniques like Role-Based Prompting and Chain-of-thought reasoning to improve the user's prompt. Don't suggest an answer to the user prompt. Don't alter code in the prompt. Don't alter equations in the prompt. Don't alter quotes in the prompt. Make sure to only improve the prompt. Keep your response concise and to the point."
    prompt = ""
    examples = [
        {
            "User prompt:": "What is the quadratic formula x = (-b±sqrt(b^2 - 4ac))/2a used for?",
            "Improved prompt:": "What is the purpose of the quadratic formula x = (-b±sqrt(b^2 - 4ac))/2a in mathematics? As a mathematics tutor, explain each component of the Quadratic Formula step by step and how they work together. Provide examples to demonstrate it's purpose.",
        },
        {
            "User prompt:": "Summarize 1984 by George Orwell and quiz me for an upcoming exam",
            "Improved prompt:": "Identify the main themes and intricate details of the novel '1984' by George Orwell. Focus on details that I, a student, needs to master the book before an exam. Then, write a summary that captures the essence of '1984'. Then, give me a practice exam with easy, medium, and hard difficulty questions. Make me ready for my upcoming exam.",
        },
        {
            "User prompt:": "If (AB)^-1 exists. why does that not imply B^-1 and A^-1 both exist?",
            "Improved prompt:": "Given that A and B are matrices and the inverse of their product (AB)^-1 exists, why does that not imply B^-1 and A^-1 both exist? Provide examples or counter examples to demonstrate this fact",
        },
    ]
    for example in examples:
        prompt += f"User prompt: {example['User prompt:']}\nImproved prompt: {example['Improved prompt:']}\n\n"
    prompt += f"User prompt: {text}\nImproved prompt:"
    messages = [
    SystemMessage(content=system_prompt),
    HumanMessage(content=prompt),
    ]
    response = llm.invoke(messages)
    original_text = text
    raw_text = response.content
    html = markdown(raw_text)
    edited_text = ''.join(BeautifulSoup(html).findAll(text=True))
    res = highlight_changes(original_text, edited_text)
    print(raw)
    return res

def optimize_prompt(text):
    token = len(text)/4
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0.3,
        timeout=None,
        max_retries=2,
    )
    system_prompt = "You are an LLM prompt engineer. You will use prompting techniques like few-shot examples and chain-of-thought reasoning to improve the user prompt. Don't suggest an answer to the user prompt. Don't alter code or technical details included in the prompt. Make sure to only improve the prompt. Keep your response concise and to the point."
    prompt = ""
    examples = [
        {
            "User prompt:": "Translate \"Good evening\" into French.",
            "Improved prompt:": "Translate the following English phrases into French:\n\n1. \"Good morning\" -> \"Bonjour\"\n2. \"Thank you\" -> \"Merci\"\n3. \"Good evening\" -> ",
        },
        {
            "User prompt:": "Summarize the following article: [Article Text]",
            "Improved prompt:": "Read the article carefully. Identify the main points and key details. Then, write a concise summary that captures the essence of the article. [Article Text]",
        },
        {
            "User prompt:": "if (AB)^-1 exists. why does that not imply B^-1 and A^-1 both exist?",
            "Improved prompt:": "Given that A and B are matrices and the inverse of their product (AB)^-1 exists, why does that not imply B^-1 and A^-1 both exist? Provide examples or counter examples to demonstrate this fact",
        },
    ]
    for example in examples:
        prompt += f"User prompt: {example['User prompt:']}\nImproved prompt: {example['Improved prompt:']}\n\n"
    prompt += f"User prompt: {text}\nImproved prompt:"
    messages = [
    SystemMessage(content=system_prompt),
    HumanMessage(content=prompt),
    ]
    response = llm.invoke(messages)
    original_text = text
    raw_text = response.content
    raw_text = raw_text.replace("\n", "\\n")
    edited_text = unmark(raw_text)
    res = highlight_changes(original_text, edited_text)
    return res


tone_settings = {
    "Professional": "Use a professional tone, keeping the language clear, respectful, and concise.",
    "Casual": "Keep the tone light, friendly, and conversational.",
    "Persuasive": "Motivate the reader to take action, using strong language and compelling arguments.",
    "Excited": "Use a highly energetic and enthusiastic tone.",
    "None": "",
}


class EditRecommendationModel(BaseModel):
    Edited_Text: str = Field(
        description="The edited text with the recommended changes."
    )
    Comments: list[str] = Field(
        description="Concise insight on each of the recommended changes."
    )

def get_open_tag(id):
    return f"<span style='color: rgb(127 29 29);	background-color: rgb(252 165 165); text-decoration-line: line-through;' id='{id}o'>"

def get_new_open_tag(id):
    return f"<span style='color: rgb(20 83 45); 	background-color: rgb(134 239 172);' id='{id}n'>"


def parse_gpt_output(raw_input):
    num_edits = 1
    original_open_tag = get_open_tag(num_edits)
    original_close_tag = "</span>"
    new_open_tag = get_new_open_tag(num_edits)
    new_close_tag = "</span>"
    output = ""
    i = 0
    while i < len(raw_input) - 2:
        if raw_input[i : i + 2] == "$[":
            output += original_open_tag
            i += 2
        elif raw_input[i : i + 2] == "]$":
            output += original_close_tag
            i += 2
        elif raw_input[i : i + 2] == "#[":
            output += new_open_tag
            i += 2
        elif raw_input[i : i + 2] == "]#":
            output += new_close_tag
            num_edits += 1
            i += 2
            original_open_tag = get_open_tag(num_edits)
            new_open_tag = get_new_open_tag(num_edits)
        else:
            output += raw_input[i]
            i += 1

    return output


def format_llm_output(output):
    res = {}
    for pair in output:
        res[pair[0]] = pair[1]
    return res


# x = generate_edits("I confidently marched out of the store with the hoodie. Just like any color on the light spectrum, yellow shines through as both a wave and a particle. To me, this color holds both the love and pain in me, naturally, simultaneously, authentically. It reminds me of that detached, frightened, and distressed nine year old kid, afraid to face uncertainty, yet desperate for a sliver of sunshine. Nonetheless, it also reminds me of the caring, optimistic, and hopeful person I’ve become. The yellow I wear, now faded and wrinkled, has never looked brighter and has become a testament to my growth.", "Professional")
# y = parse_gpt_output(x.Edited_Text)
# print(y)