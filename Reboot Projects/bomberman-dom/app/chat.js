import { store } from './store.js';
import { runtime } from './runtime.js';

export function appendMessage(message) {
  const chat = store.getState().chat;
  chat.messages.push(message);
  if (chat.messages.length > 120) {
    chat.messages.shift();
  }
  store.setState({ chat });
}

export function sendChat() {
  const state = store.getState();
  const text = state.chatDraft.trim();
  if (!text) return;
  if (runtime.gameSocket) {
    runtime.gameSocket.send(JSON.stringify({ type: 'chat', text }));
  }
  store.setState({ chatDraft: '' });
}

export function connectChat() {
  const chat = store.getState().chat;
  chat.connected = true;
  chat.status = 'connected';
  store.setState({ chat });
}
