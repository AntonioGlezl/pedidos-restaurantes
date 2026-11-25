# Reservas de restaurantes

## Ejecutar con Docker

El entorno de desarrollo se ejecuta completamente dentro de Docker. No necesitas instalar Node.js, npm, Prisma ni PostgreSQL en el equipo local.

La aplicación usa la base de datos PostgreSQL ya alojada en Supabase; el archivo `compose.yml` no crea una base de datos local.

1. Crea o copia `.env` en la raíz del proyecto. Debe contener, como mínimo:

   ```env
   DATABASE_URL=postgresql://...
   DIRECT_URL=postgresql://...
   AUTH_SECRET=...
   AUTH_URL=http://localhost:3000
   ```

   Para una base de Supabase, `DATABASE_URL` y `DIRECT_URL` pueden apuntar a la misma instancia. Deja una sola definición de cada variable.

2. Inicia el entorno:

   ```bash
   docker compose up --build
   ```

3. Abre [http://localhost:3000](http://localhost:3000).

Al arrancar, el contenedor genera el cliente de Prisma. Las dependencias, el cliente generado y la caché de compilación de Next.js se guardan en volúmenes Docker, no en el sistema local. El proceso se ejecuta con el usuario no privilegiado `node`.

### Migraciones

No ejecutes migraciones automáticamente sobre una base de Supabase existente. Comprueba primero su estado:

```bash
docker compose run --rm --no-deps web npx prisma migrate status
```

Solo aplica migraciones cuando quieras que la estructura de la base cambie y hayas revisado el resultado:

```bash
docker compose run --rm --no-deps web npx prisma migrate deploy
```

Para detener el entorno:

```bash
docker compose down
```

Para borrar también las dependencias y el cliente Prisma almacenados por Docker:

```bash
docker compose down -v
```
