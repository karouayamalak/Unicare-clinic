export const DEFAULT_MONGO_URI = "mongodb://127.0.0.1:27017/unicare";

export const resolveMongoConnectionUri = (configuredUri?: string): string => {
  const normalizedUri = configuredUri?.trim();
  return normalizedUri ? normalizedUri : DEFAULT_MONGO_URI;
};
