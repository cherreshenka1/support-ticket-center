import OpenContext from './OpenContext.jsx'
import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'support-ticket-center-state'

const initialTickets = [
  {
    id: 'TK-1042',
    client: 'Мария Романова',
    subject: 'Не проходит оплата заказа',
    status: 'Открыт',
    priority: 'Высокий',
    slaMinutes: 18,
    channel: 'Email',
    messages: [
      { author: 'Клиент', text: 'Платёж отклоняется при оплате картой.', time: '10:24' },
      { author: 'Оператор', text: 'Проверяю шлюз и статус транзакции.', time: '10:29' },
    ],
  },
  {
    id: 'TK-1038',
    client: 'Илья Соколов',
    subject: 'Нужен возврат товара',
    status: 'В работе',
    priority: 'Средний',
    slaMinutes: 54,
    channel: 'Telegram',
    messages: [
      { author: 'Клиент', text: 'Хочу оформить возврат по заказу #58421.', time: '09:15' },
      { author: 'Оператор', text: 'Отправила инструкцию и форму заявки.', time: '09:21' },
    ],
  },
  {
    id: 'TK-1031',
    client: 'Алина К.',
    subject: 'Ошибка в личном кабинете',
    status: 'Ожидает клиента',
    priority: 'Низкий',
    slaMinutes: 130,
    channel: 'Web chat',
    messages: [
      { author: 'Клиент', text: 'Профиль не сохраняет новый адрес.', time: 'Вчера' },
      { author: 'Оператор', text: 'Попросила видео и браузерную версию.', time: 'Вчера' },
    ],
  },
]

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : initialTickets
  } catch {
    return initialTickets
  }
}

export default function App() {
  const [tickets, setTickets] = useState(loadState)
  const [activeId, setActiveId] = useState(tickets[0]?.id || '')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('Все статусы')
  const [priorityFilter, setPriorityFilter] = useState('Все приоритеты')
  const [drafts, setDrafts] = useState({})

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets))
  }, [tickets])

  const filteredTickets = useMemo(
    () =>
      tickets.filter((ticket) => {
        const textMatch = `${ticket.id} ${ticket.client} ${ticket.subject}`
          .toLowerCase()
          .includes(query.toLowerCase().trim())
        const statusMatch = statusFilter === 'Все статусы' || ticket.status === statusFilter
        const priorityMatch =
          priorityFilter === 'Все приоритеты' || ticket.priority === priorityFilter
        return textMatch && statusMatch && priorityMatch
      }),
    [priorityFilter, query, statusFilter, tickets],
  )

  const activeTicket = filteredTickets.find((ticket) => ticket.id === activeId) || filteredTickets[0]
  const draft = drafts[activeTicket?.id] || ''
  const setDraft = value => { if (activeTicket) setDrafts(current => ({...current, [activeTicket.id]: value})) }

  const updateActiveTicket = (patch) => {
    if (!activeTicket) return
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === activeTicket?.id ? { ...ticket, ...patch } : ticket,
      ),
    )
  }

  const sendMessage = (event) => {
    event.preventDefault()
    if (!draft.trim() || !activeTicket) return

    updateActiveTicket({
      messages: [
        ...activeTicket.messages,
        {
          author: 'Оператор',
          text: draft.trim(),
          time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        },
      ],
      status: activeTicket.status === 'Открыт' ? 'В работе' : activeTicket.status,

    })
    setDraft('')
  }

  return (
    <div className="desk-shell">
      <aside className="tickets-column">
        <header className="brand-block">
          <p className="eyebrow">Support Ticket Center</p>
          <h1>Входящие обращения</h1>
        </header>

        <input
          className="search-input"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск по ID, клиенту или теме"
        />

        <div className="filters-row">
          <select aria-label="Фильтр статуса" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option>Все статусы</option>
            <option>Открыт</option>
            <option>В работе</option>
            <option>Ожидает клиента</option>
            <option>Закрыт</option>
          </select>
          <select aria-label="Фильтр приоритета" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
            <option>Все приоритеты</option>
            <option>Высокий</option>
            <option>Средний</option>
            <option>Низкий</option>
          </select>
        </div>

        <p className="demo-note">Учебные обращения. Ответы остаются в этой демо-переписке.</p><div className="ticket-list">{filteredTickets.length === 0 && <p className="empty-text">Обращений не найдено. Измените поиск или фильтры.</p>}
          {filteredTickets.map((ticket) => (
            <button
              type="button"
              key={ticket.id}
              className={ticket.id === activeTicket?.id ? 'ticket-card active' : 'ticket-card'}
              onClick={() => setActiveId(ticket.id)}
            >
              <div className="ticket-top">
                <strong>{ticket.id}</strong>
                <span className={ticket.priority === 'Высокий' ? 'priority hot' : 'priority'}>
                  {ticket.priority}
                </span>
              </div>
              <h2>{ticket.subject}</h2>
              <p>{ticket.client} • {ticket.channel}</p>
              <div className="sla-line">
                <span>{ticket.status}</span>
                <em>Срок ответа: {ticket.slaMinutes} мин</em>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <main className="chat-column">
        <section className="ticket-detail">{!activeTicket && <p className="empty-text">Выберите обращение из очереди.</p>}
          <div className="detail-header">
            <div>
              <p className="eyebrow">{activeTicket?.client}</p>
              <h2>{activeTicket?.subject}</h2>
            </div>
            <div className="status-actions">
              <select
                aria-label="Статус обращения" disabled={!activeTicket} value={activeTicket?.status || 'Открыт'}
                onChange={(event) => updateActiveTicket({ status: event.target.value })}
              >
                <option>Открыт</option>
                <option>В работе</option>
                <option>Ожидает клиента</option>
                <option>Закрыт</option>
              </select>
              <div className="sla-badge">Демо SLA: {activeTicket?.slaMinutes ?? "—"} мин</div>
            </div>
          </div>

          <div className="messages-list">
            {activeTicket?.messages.map((message, index) => (
              <article
                className={message.author === 'Оператор' ? 'message-card agent' : 'message-card'}
                key={`${message.time}-${index}`}
              >
                <div className="message-meta">
                  <strong>{message.author}</strong>
                  <span>{message.time}</span>
                </div>
                <p>{message.text}</p>
              </article>
            ))}
          </div>

          <form className="reply-form" onSubmit={sendMessage}>
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              aria-label="Ответ" disabled={!activeTicket} placeholder="Написать ответ…"
            />
            <button type="submit" disabled={!activeTicket || !draft.trim()}>Добавить ответ</button>
          </form>
        </section>
      </main>
      <OpenContext/>
    </div>
  )
}
