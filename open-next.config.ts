import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Sin caché incremental: las páginas públicas leen el snapshot publicado en cada petición.
export default defineCloudflareConfig({});
