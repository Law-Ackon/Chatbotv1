// ============================================
// CONFIGURATION - PASTE YOUR API KEY HERE
// ============================================
const OPENAI_API_KEY =
  " " // <-- PASTE YOUR API KEY BETWEEN THE QUOTES

// ============================================
// SCHOOL DATA - Add more JSON data here
// ============================================
const schoolData = {}



// ============================================
// DOM ELEMENTS
// ============================================
const chatButton = document.getElementById("chatButton")
const chatWidget = document.getElementById("chatWidget")
const closeChat = document.getElementById("closeChat")
const chatInput = document.getElementById("chatInput")
const sendBtn = document.getElementById("sendBtn")
const chatMessages = document.getElementById("chatMessages")

// ============================================
// EVENT LISTENERS
// ============================================
chatButton.addEventListener("click", openChat)
closeChat.addEventListener("click", closeChatWidget)
sendBtn.addEventListener("click", sendMessage)
chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMessage()
  }
})

// ============================================
// CHAT FUNCTIONS
// ============================================
function openChat() {
  chatWidget.classList.add("active")
  chatButton.classList.add("hidden")
  chatInput.focus()
}

function closeChatWidget() {
  chatWidget.classList.remove("active")
  chatButton.classList.remove("hidden")
}

function formatMessage(text) {
  // Convert markdown headers
  text = text.replace(/### (.*?)(\n|$)/g, "<h3>$1</h3>")
  text = text.replace(/## (.*?)(\n|$)/g, "<h2>$1</h2>")

  // Convert bold text
  text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

  // Convert links [text](url)
  text = text.replace(/\[(.*?)\]$$(.*?)$$/g, '<a href="$2" target="_blank">$1</a>')

  // Convert bullet points
  text = text.replace(/^- (.*?)$/gm, "<li>$1</li>")
  text = text.replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>")

  // Convert line breaks
  text = text.replace(/\n/g, "<br>")

  return text
}

function addMessage(message, isUser = false) {
  const messageDiv = document.createElement("div")
  messageDiv.className = isUser ? "user-message" : "bot-message"

  const messagePara = document.createElement("div")

  if (isUser) {
    messagePara.textContent = message
  } else {
    messagePara.innerHTML = formatMessage(message)
  }

  messageDiv.appendChild(messagePara)
  chatMessages.appendChild(messageDiv)

  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight
}

function showTypingIndicator() {
  const typingDiv = document.createElement("div")
  typingDiv.className = "bot-message typing-indicator"
  typingDiv.id = "typingIndicator"

  typingDiv.innerHTML = "<span></span><span></span><span></span>"

  chatMessages.appendChild(typingDiv)
  chatMessages.scrollTop = chatMessages.scrollHeight
}

function removeTypingIndicator() {
  const typingIndicator = document.getElementById("typingIndicator")
  if (typingIndicator) {
    typingIndicator.remove()
  }
}

async function sendMessage() {
  const message = chatInput.value.trim()

  if (!message) return

  // Check if API key is set
  if (OPENAI_API_KEY === "YOUR_OPENAI_API_KEY_HERE") {
    addMessage("Please set your OpenAI API key in the script.js file.", false)
    return
  }

  // Add user message
  addMessage(message, true)
  chatInput.value = ""

  // Disable input while processing
  chatInput.disabled = true
  sendBtn.disabled = true

  // Show typing indicator
  showTypingIndicator()

  try {
    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a helpful virtual assistant for the University of Cape Coast in Ghana. 
                        
Your job is to answer questions about admissions, programs, departments, and general information about the university.

Use ONLY the following data to answer questions. If the information is not in this data, politely say you don't have that information and suggest they contact the university directly.

UNIVERSITY DATA:
${JSON.stringify(schoolData, null, 2)}

Guidelines:
- Be friendly and professional
- Keep responses SHORT and concise (max 3-4 sentences for general questions)
- NEVER use curly brackets or square brackets in your responses
- Instead of listing items with brackets, use natural language: "The programs include Business, Medicine, and Engineering" instead of "[Business, Medicine, Engineering]"
- Only provide detailed lists when specifically asked
- When listing programs, show maximum 3-5 examples and say "and more" if there are others
- Always include relevant URLs when mentioning programs or departments
- Format responses clearly with line breaks between sections
- If asked about admissions, direct them to the website
- Use bullet points sparingly, only when listing specific items requested
- Write naturally as if talking to a person, not reading code or data`,
          },
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))

      // Handle specific error codes
      if (response.status === 429) {
        throw new Error(
          "Rate limit exceeded. Please check your OpenAI billing at https://platform.openai.com/account/billing or wait a moment and try again.",
        )
      } else if (response.status === 401) {
        throw new Error("Invalid API key. Please check your OpenAI API key in script.js")
      } else if (response.status === 403) {
        throw new Error("API key doesn't have permission. Please check your OpenAI account settings.")
      } else {
        throw new Error(`API Error (${response.status}): ${errorData.error?.message || "Unknown error"}`)
      }
    }

    const data = await response.json()
    const aiMessage = data.choices[0].message.content

    // Remove typing indicator
    removeTypingIndicator()

    // Add AI response
    addMessage(aiMessage, false)
  } catch (error) {
    removeTypingIndicator()
    addMessage(error.message, false)
  } finally {
    // Re-enable input
    chatInput.disabled = false
    sendBtn.disabled = false
    chatInput.focus()
  }

}
