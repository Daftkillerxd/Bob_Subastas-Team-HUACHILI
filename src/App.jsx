import { useState } from 'react'
import './App.css'

function App() {
  const [input, setInput] = useState('')
  const [chat, setChat] = useState([])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!input.trim()) return

    // Agrega mensaje del usuario al chat
    setChat(prev => [...prev, { role: 'user', content: input }])

    try {
      const res = await fetch('https://proy2-chatbot-legal.onrender.com/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input })
      })

      const data = await res.json()

      // Agrega la respuesta del bot al chat
      setChat(prev => [...prev, { role: 'user', content: input }, { role: 'bot', content: data.respuesta }])
      setInput('')
    } catch (error) {
      console.error('Error:', error)
      setChat(prev => [...prev, { role: 'bot', content: $`Error al conectar con el servidor` }])
    }
  }

  return (
    <div className="chat-container">
      <h2>Chat Legal – Herencia Intestada</h2>
      <div className="chat-box">
        {chat.map((msg, idx) => (
          <div key={idx} className={`chat-message ${msg.role}`}>
            <strong>{msg.role === 'user' ? 'Tú' : 'Bot'}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="chat-form">
        <input
          type="text"
          value={input}
          placeholder="Escribe tu consulta..."
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit">Enviar</button>
      </form>
    </div>
  )
}

export default App
