export default class Logger {
  constructor(cmd, namespace, credentials = {}) {
    this.command = cmd;
    this.namespace = namespace;
    this.credentials = credentials;
  }

  async publish(json) {
    console.log("Registry: ", JSON.stringify(json));
  }

  async error(user, { stack, message }) {
    const json = {
      user,
      timestamp: new Date(),
      level: 'error',
      namespace: `error:${this.namespace}`,
      command: this.command,
      body: {
        message,
        stack,
      },
    };

    return this.publish(json);
  }

  async info(user, message) {
    const json = {
      user,
      timestamp: new Date(),
      level: 'info',
      namespace: `info:${this.namespace}`,
      command: this.command,
      body: message,
    };

    return this.publish(json);
  }
}
