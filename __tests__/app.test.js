const request = require('supertest');
const { app, resetContacts } = require('../src/app');

describe('API REST de Contactos Mejorada (Ejercicio 6 - Integration Tests)', () => {
  
  beforeEach(() => {
    resetContacts();
  });

  /* A */
  describe('Bloque A: Validación de email con Regex (POST)', () => {
    it('debería devolver 400 cuando el email es "@" (sin usuario ni dominio)', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .send({ name: 'Test', email: '@' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/email/i);
    });

    it('debería devolver 400 cuando el email es "usuario@" (sin dominio)', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .send({ name: 'Test', email: 'usuario@' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/email/i);
    });

    it('debería devolver 400 cuando el email es "@dominio.com" (sin usuario)', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .send({ name: 'Test', email: '@dominio.com' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/email/i);
    });

    it('debería devolver 400 cuando el email es "sin-arroba"', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .send({ name: 'Test', email: 'sin-arroba' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/email/i);
    });

    it('debería devolver 201 cuando el email tiene un formato válido "usuario@dominio.com"', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .send({ name: 'Carlos Pérez', email: 'usuario@dominio.com' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id', 4);
    });
  });

  /* B*/
  describe('Bloque B: Detección de email duplicado - 409 Conflict', () => {
    it('debería devolver 409 al crear un contacto con un email que ya existe', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .send({ name: 'Ana Clon', email: 'ana@example.com' });

      expect(res.status).toBe(409);
    });

    it('debería incluir el campo error con un mensaje descriptivo en el body del 409', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .send({ name: 'Ana Clon', email: 'ana@example.com' });

      expect(res.body).toHaveProperty('error', 'Ya existe un contacto con ese email.');
    });

    it('debería devolver 409 si el email se envía en mayúsculas ("ANA@EXAMPLE.COM") estando en minúsculas en la BD', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .send({ name: 'Ana Mayúsculas', email: 'ANA@EXAMPLE.COM' });

      expect(res.status).toBe(409);
    });

    it('debería verificar que el número total de contactos no aumentó tras un error 409 (no-op)', async () => {
      await request(app)
        .post('/api/contacts')
        .send({ name: 'Luis Clon', email: 'luis@example.com' });

      const listRes = await request(app).get('/api/contacts');
      expect(listRes.body).toHaveLength(3);
    });
  });

  /*C */
  describe('Bloque C: Búsqueda y filtros (?search= y ?favorite=)', () => {
    it('?search=ana debería devolver solo contactos cuyo nombre o email contengan "ana"', async () => {
      const res = await request(app).get('/api/contacts').query({ search: 'ana' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('Ana García');
    });

    it('?search=ANA debería ser case-insensitive y devolver los mismos resultados', async () => {
      const res = await request(app).get('/api/contacts').query({ search: 'ANA' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('Ana García');
    });

    it('?search=example debería filtrar por email y devolver todos los que tengan @example.com', async () => {
      const res = await request(app).get('/api/contacts').query({ search: 'example' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(3);
    });

    it('?search=xyznoexiste debería devolver un array vacío [] (Status 200, no 404)', async () => {
      const res = await request(app).get('/api/contacts').query({ search: 'xyznoexiste' });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(0);
    });

    it('?favorite=true debería devolver solo contactos marcados con favorite: true', async () => {
      const res = await request(app).get('/api/contacts').query({ favorite: 'true' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('Luis Pérez');
    });

    it('?favorite=true debería devolver un array vacío si ningún contacto cumple la condición', async () => {
      await request(app).patch('/api/contacts/2/favorite');

      const res = await request(app).get('/api/contacts').query({ favorite: 'true' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(0);
    });

    it('no pasar query params debería devolver todos los contactos sin alteración', async () => {
      const res = await request(app).get('/api/contacts');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(3);
    });
  });

  /* D */
  describe('Bloque D: Toggle de favorito (PATCH)', () => {
    it('debería cambiar favorite de false a true en Ana (id=1)', async () => {
      const res = await request(app).patch('/api/contacts/1/favorite');

      expect(res.status).toBe(200);
      expect(res.body.favorite).toBe(true);
    });

    it('debería regresar a false si se llama dos veces consecutivas sobre el mismo id (toggle)', async () => {
      await request(app).patch('/api/contacts/1/favorite');
      const res = await request(app).patch('/api/contacts/1/favorite');

      expect(res.status).toBe(200);
      expect(res.body.favorite).toBe(false);
    });

    it('debería cambiar favorite de true a false en Luis (id=2)', async () => {
      const res = await request(app).patch('/api/contacts/2/favorite');

      expect(res.status).toBe(200);
      expect(res.body.favorite).toBe(false);
    });

    it('debería devolver status 404 para un ID inexistente al intentar cambiar favorito', async () => {
      const res = await request(app).patch('/api/contacts/999/favorite');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Contacto no encontrado.');
    });

    it('debería verificar la persistencia del cambio en memoria mediante un GET independiente', async () => {
      await request(app).patch('/api/contacts/1/favorite');

      const checkRes = await request(app).get('/api/contacts/1');
      expect(checkRes.body.favorite).toBe(true);
    });
  });

  /* E*/
  describe('Bloque E: PUT Mejorado', () => {
    it('debería actualizar solo el name y devolver 200 con el cambio efectuado', async () => {
      const res = await request(app)
        .put('/api/contacts/1')
        .send({ name: 'Ana Editada' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Ana Editada');
    });

    it('debería devolver status 400 si el name enviado está vacío o son espacios en blanco', async () => {
      const res = await request(app)
        .put('/api/contacts/1')
        .send({ name: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('no puede estar vacío');
    });

    it('debería devolver status 400 si se intenta actualizar el email con un formato inválido', async () => {
      const res = await request(app)
        .put('/api/contacts/1')
        .send({ email: 'correoSinPuntoNiArroba' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('El formato del email es inválido.');
    });

    it('debería devolver status 409 si se intenta cambiar el email al de otro contacto existente', async () => {
      const res = await request(app)
        .put('/api/contacts/1')
        .send({ email: 'luis@example.com' });

      expect(res.status).toBe(409);
    });

    it('debería devolver status 200 si se actualiza el email usando su mismo valor actual (sin cambio real)', async () => {
      const res = await request(app)
        .put('/api/contacts/1')
        .send({ email: 'ana@example.com' });

      expect(res.status).toBe(200);
    });

    it('debería devolver status 404 si se intenta actualizar un ID inexistente', async () => {
      const res = await request(app)
        .put('/api/contacts/404040')
        .send({ name: 'Inexistente' });

      expect(res.status).toBe(404);
    });
  });

  /*F */
  describe('Bloque F: Middleware de error y respuestas uniformes', () => {
    it('debería devolver 404 con Content-Type JSON al consultar una ruta que no existe', async () => {
      await request(app)
        .get('/api/ruta-que-no-existe')
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('debería verificar que el cuerpo del 404 genérico tenga estructura JSON válida sin HTML', async () => {
      const res = await request(app).get('/api/sistema/vistas/cyberpunk');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        status: 404,
        error: 'Ruta no encontrada.'
      });
    });

    it('debería verificar que todos los errores de negocio (400, 404, 409) incluyan la propiedad "status"', async () => {
      const res404 = await request(app).get('/api/contacts/888');
      expect(res404.body).toHaveProperty('status', 404);

      const res400 = await request(app).post('/api/contacts').send({ name: '', email: 'mal@@' });
      expect(res400.body).toHaveProperty('status', 400);

      const res409 = await request(app).post('/api/contacts').send({ name: 'Ana', email: 'ana@example.com' });
      expect(res409.body).toHaveProperty('status', 409);
    });
  });

});