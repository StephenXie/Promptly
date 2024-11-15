# Cursor for ChatGPT Prompt Optimization

## Overview

This extension is designed to help you optimize your ChatGPT prompts for better results. It provides a simple and user-friendly interface for generating, optimizing, and adjusting content.

## Backend APIs

To support the functionality of optimizing ChatGPT prompts, the following backend APIs are suggested:

1. **Prompt Generation API**
   - **Endpoint:** `/api/generate-prompt`
   - **Method:** `POST`
   - **Description:** Generates a new prompt based on user input and predefined templates.
   - **Request Body:**

     ```json
     {
       "input": "string",
       "template_id": "string"
     }
     ```

   - **Response:**

     ```json
     {
       "generated_prompt": "string"
     }
     ```
