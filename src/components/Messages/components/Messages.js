import React, { useEffect, useContext, useState, useCallback } from 'react';
import io from 'socket.io-client';
import useSound from 'use-sound';
import config from '../../../config';
import LatestMessagesContext from '../../../contexts/LatestMessages/LatestMessages';
import INITIAL_BOTTY_MESSAGE from '../../../common/constants/initialBottyMessage';
import Header from './Header';
import Footer from './Footer';
import Message from './Message';
import TypingMessage from './TypingMessage';
import '../styles/_messages.scss';

const ME = 'me';
const BOTTY = 'bot';

const socket = io(
  config.BOT_SERVER_ENDPOINT,
  { transports: ['websocket', 'polling', 'flashsocket'] }
);


const INITIAL_MESSAGE = {
  message: INITIAL_BOTTY_MESSAGE,
  id: Date.now(),
  user: BOTTY
};


function scrollToBottom() {
  const list = document.getElementById('message-list');

  list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
}

function Messages() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [botTyping, setBotTyping] = useState(false);
  const [playSend] = useSound(config.SEND_AUDIO_URL);
  const [playReceive] = useSound(config.RECEIVE_AUDIO_URL);
  const { setLatestMessage } = useContext(LatestMessagesContext);

  useEffect(() => {
    socket.off('bot-message');
    socket.on('bot-message', (message) => {
      setBotTyping(false);

      setMessages([...messages, { message, user: BOTTY, id: Date.now() }]);

      setLatestMessage(BOTTY, message);

      playReceive();

      scrollToBottom();
    });

  }, [messages]);

  useEffect(() => {
    document.getElementById('user-message-input').focus()

    socket.on('bot-typing', () => {
      setBotTyping(true);

      scrollToBottom();
    });
  }, []);

  const sendMessage = useCallback(() => {
    if (!message) { return; }

    setMessages([...messages, { message, user: ME, id: Date.now() }]);

    playSend();

    scrollToBottom();

    socket.emit('user-message', message);

    setMessage('');

    document.getElementById('user-message-input').value = '';
  }, [messages, message]);

  const onChangeMessage = ({ target: { value }}) => {
    setMessage(value)
  };

  return (
    <div className="messages">
      <Header />
      <div className="messages__list" id="message-list">
        {messages.map((message, index) => (
          <Message message={message} nextMessage={messages[index + 1]} botTyping={botTyping} />
        ))}
        {botTyping ? <TypingMessage /> : null}
      </div>
      <Footer message={message} sendMessage={sendMessage} onChangeMessage={onChangeMessage} />
    </div>
  );
}

export default Messages;