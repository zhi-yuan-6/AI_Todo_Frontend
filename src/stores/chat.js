// stores/chat.js
import {
  defineStore
} from 'pinia';

export const useChatStore = defineStore('chat', {
  state: () => ({
    messages: [{
      type: 'ai',
      content: '你好！我是AI任务助手，你可以告诉我你的需求，我会帮助你处理任务。',
      timestamp: Date.now()
    }],
    loading: false
  }),

  actions: {
    addMessage(message) {
      this.messages.push(message);
    },

    setLoading(status) {
      this.loading = status;
    }
  }
});
