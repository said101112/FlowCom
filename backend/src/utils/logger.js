const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const ACTIVE_LEVEL = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info;

function emit(level, stream, args) {
  if (LEVELS[level] > ACTIVE_LEVEL) return;
  const timestamp = new Date().toISOString();
  stream(`${timestamp} [${level.toUpperCase()}]`, ...args);
}

export const logger = {
  error: (...args) => emit('error', console.error, args),
  warn: (...args) => emit('warn', console.warn, args),
  info: (...args) => emit('info', console.log, args),
  debug: (...args) => emit('debug', console.log, args),
};