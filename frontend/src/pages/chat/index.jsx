import { useState, useEffect, useRef, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow, format } from 'date-fns'
import { messagesAPI } from '../../api'
import { selectUser } from '../../store'
import { DashboardLayout } from '../../components/layout'
import { Avatar, Button, Spinner, EmptyState } from '../../components/common'
import { useSocket } from '../../hooks/useSocket'
import toast from 'react-hot-toast'

export const ChatPage = ({ role = 'jobseeker' }) => {
  const user = useSelector(selectUser)
  const { on, off, joinConversation, leaveConversation, sendTyping } = useSocket()
  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [msgLoading, setMsgLoading] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [typing, setTyping] = useState(null)
  const bottomRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  // Load conversations
  useEffect(() => {
    messagesAPI.getConversations()
      .then(res => setConversations(res.data.conversations || []))
      .finally(() => setLoading(false))
  }, [])

  // Socket events
  useEffect(() => {
    const cleanup1 = on('new_message', ({ message, conversationId }) => {
      if (activeConv?._id === conversationId) {
        setMessages(prev => [...prev, message])
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
      setConversations(prev => prev.map(c =>
        c._id === conversationId
          ? { ...c, lastMessageText: message.message, lastMessageAt: message.createdAt }
          : c
      ).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)))
    })

    const cleanup2 = on('user_typing', ({ userId, name }) => {
      if (userId !== user?._id) setTyping(name)
    })

    const cleanup3 = on('user_stop_typing', () => setTyping(null))

    return () => { cleanup1?.(); cleanup2?.(); cleanup3?.() }
  }, [on, activeConv, user])

  // Load messages when conversation selected
  useEffect(() => {
    if (!activeConv) return
    setMsgLoading(true)
    joinConversation(activeConv._id)
    messagesAPI.getMessages(activeConv._id)
      .then(res => {
        setMessages(res.data.messages || [])
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      })
      .finally(() => setMsgLoading(false))

    return () => leaveConversation(activeConv._id)
  }, [activeConv?._id])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!text.trim() || !activeConv) return
    setSending(true)
    const msgText = text.trim()
    setText('')
    try {
      const res = await messagesAPI.send(activeConv._id, { message: msgText })
      setMessages(prev => [...prev, res.data.message])
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } catch {
      setText(msgText)
    }
    finally { setSending(false) }
  }

  const handleTyping = (val) => {
    setText(val)
    if (!activeConv) return
    sendTyping(activeConv._id, true)
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => sendTyping(activeConv._id, false), 1500)
  }

  const getOtherParticipant = (conv) => {
    return conv.participants?.find(p => p._id !== user?._id)
  }

  return (
    <DashboardLayout role={role} pageTitle="Messages">
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', height: 'calc(100vh - 120px)',
        background: '#fff', borderRadius: 16, border: '1px solid var(--gray-200)', overflow: 'hidden' }}>

        {/* Sidebar */}
        <div style={{ borderRight: '1px solid var(--gray-100)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--gray-100)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>Messages</h3>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner /></div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--gray-400)', fontSize: 14 }}>
                No conversations yet
              </div>
            ) : conversations.map(conv => {
              const other = getOtherParticipant(conv)
              const isActive = activeConv?._id === conv._id
              const unread = conv.unreadCount?.get?.(user?._id) || 0
              return (
                <button key={conv._id} onClick={() => setActiveConv(conv)}
                  style={{
                    width: '100%', padding: '14px 16px', border: 'none', cursor: 'pointer', textAlign: 'left',
                    background: isActive ? 'var(--brand-50)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--brand-500)' : '3px solid transparent',
                    transition: 'all .15s',
                    display: 'flex', gap: 12, alignItems: 'center',
                  }}>
                  <Avatar src={other?.avatar?.secureUrl} name={`${other?.firstName} ${other?.lastName}`} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: isActive ? 'var(--brand-700)' : 'var(--gray-800)', truncate: true }}>
                        {other?.firstName} {other?.lastName}
                      </p>
                      {unread > 0 && (
                        <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--brand-500)',
                          color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                          {unread}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--gray-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conv.lastMessageText || 'Start conversation'}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Chat Area */}
        {activeConv ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            {(() => {
              const other = getOtherParticipant(activeConv)
              return (
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--gray-100)',
                  display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar src={other?.avatar?.secureUrl} name={`${other?.firstName} ${other?.lastName}`} size="sm" />
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15 }}>{other?.firstName} {other?.lastName}</p>
                    <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>{other?.role}</p>
                  </div>
                  {activeConv.jobId && (
                    <span className="badge badge-blue" style={{ marginLeft: 'auto', fontSize: 11 }}>
                      re: {activeConv.jobId.title}
                    </span>
                  )}
                </div>
              )
            })()}

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {msgLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner size={28} /></div>
              ) : messages.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>Send the first message!</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMe = msg.sendBy?._id === user?._id || msg.sendBy === user?._id
                  const showAvatar = !isMe && (i === 0 || messages[i-1]?.sendBy?._id !== msg.sendBy?._id)
                  return (
                    <motion.div key={msg._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      style={{ display: 'flex', gap: 8, justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end' }}>
                      {!isMe && (
                        <div style={{ width: 28, flexShrink: 0 }}>
                          {showAvatar && <Avatar src={msg.sendBy?.avatar?.secureUrl} name={msg.sendBy?.firstName} size="sm" />}
                        </div>
                      )}
                      <div style={{ maxWidth: '65%' }}>
                        <div style={{
                          padding: '10px 14px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          background: isMe ? 'var(--brand-600)' : 'var(--gray-100)',
                          color: isMe ? '#fff' : 'var(--gray-800)',
                          fontSize: 14, lineHeight: 1.5,
                        }}>
                          {msg.message}
                          {msg.attachments?.length > 0 && msg.attachments.map(a => (
                            <a key={a.publicId} href={a.secureUrl} target="_blank" rel="noreferrer"
                              style={{ display: 'block', marginTop: 6, color: isMe ? 'rgba(255,255,255,.8)' : 'var(--brand-600)', fontSize: 12 }}>
                              📎 {a.filename}
                            </a>
                          ))}
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 3, textAlign: isMe ? 'right' : 'left' }}>
                          {format(new Date(msg.createdAt), 'HH:mm')}
                        </p>
                      </div>
                    </motion.div>
                  )
                })
              )}

              {/* Typing indicator */}
              {typing && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ background: 'var(--gray-100)', padding: '10px 14px', borderRadius: '16px 16px 16px 4px', fontSize: 13, color: 'var(--gray-500)' }}>
                    <span>{typing} is typing</span>
                    <span style={{ display: 'inline-flex', gap: 3, marginLeft: 6 }}>
                      {[0,1,2].map(i => <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gray-400)', animation: `spin .8s ${i*0.2}s infinite` }} />)}
                    </span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend}
              style={{ padding: '16px 20px', borderTop: '1px solid var(--gray-100)', display: 'flex', gap: 10 }}>
              <input
                className="form-input"
                value={text}
                onChange={e => handleTyping(e.target.value)}
                placeholder="Type a message..."
                style={{ flex: 1, borderRadius: 99, padding: '10px 18px' }}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend(e)}
              />
              <Button type="submit" loading={sending} disabled={!text.trim()}
                style={{ borderRadius: '50%', width: 44, height: 44, padding: 0, flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </Button>
            </form>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--gray-400)' }}>
            <div style={{ fontSize: 64 }}>💬</div>
            <p style={{ fontSize: 16, fontWeight: 600 }}>Select a conversation</p>
            <p style={{ fontSize: 14 }}>Choose from your message list to start chatting</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
