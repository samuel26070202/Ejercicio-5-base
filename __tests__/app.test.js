const request = require('supertest');
const { app, resetContacts } = require('../src/app');

describe('API REST de Contactos (Integration Tests con Supertest)', () => {
  
  beforeEach(() => {

    resetContacts();
  });


  describe('GET /api/contacts', () => {
    it('debería devolver status 200 y un array con todos los contactos', async () => {
      const res = await request(app).get('/api/contacts');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
    });
  });


  describe('GET /api/contacts/:id', () => {
    it('debería devolver el contacto correcto según el ID proporcionado', async () => {
      const res = await request(app).get('/api/contacts/1');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: 1,
        name: 'Samuel Mahecha',
        email: 'samuel@sena.edu.co'
      });
    });

    it('debería devolver un status 404 si el ID del contacto no existe', async () => {
      const res = await request(app).get('/api/contacts/999');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Contacto no encontrado.');
    });
  });


  describe('POST /api/contacts', () => {
    it('debería crear un contacto exitosamente y devolver status 201', async () => {
      const newContact = { name: 'Carlos Pérez', email: 'carlos@test.com', phone: '3159998877' };
      
      const res = await request(app)
        .post('/api/contacts')
        .send(newContact);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        id: 3,
        name: 'Carlos Pérez',
        email: 'carlos@test.com',
        phone: '3159998877'
      });
    });

    it('debería devolver status 400 si falta el campo name o está vacío', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .send({ email: 'sin-nombre@test.com' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('name es requerido');
    });

    it('debería devolver status 400 si el email no contiene un carácter @', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .send({ name: 'Andrés', email: 'email-invalido.com' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('debe contener un @');
    });
  });


  describe('PUT /api/contacts/:id', () => {
    it('debería actualizar correctamente solo los campos enviados', async () => {
      const updates = { name: 'Samuel M. Editado', phone: '3110001122' };

      const res = await request(app)
        .put('/api/contacts/1')
        .send(updates);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: 1,
        name: 'Samuel M. Editado',
        email: 'samuel@sena.edu.co', 
        phone: '3110001122'
      });
    });

    it('debería devolver status 400 si se intenta actualizar el email con uno sin @', async () => {
      const res = await request(app)
        .put('/api/contacts/1')
        .send({ email: 'correoMalHecho' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('debe contener un @');
    });

    it('debería devolver status 404 si se intenta actualizar un contacto inexistente', async () => {
      const res = await request(app)
        .put('/api/contacts/555')
        .send({ name: 'Nadie' });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Contacto no encontrado.');
    });
  });


  describe('DELETE /api/contacts/:id', () => {
    it('debería eliminar el contacto exitosamente y devolver confirmación con status 200', async () => {
      const res = await request(app).delete('/api/contacts/2');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Contacto eliminado.');

      // Doble verificación: El GET general ahora debe tener un solo elemento
      const checkGet = await request(app).get('/api/contacts');
      expect(checkGet.body).toHaveLength(1);
    });

    it('debería devolver status 404 si se intenta eliminar un ID que no existe', async () => {
      const res = await request(app).delete('/api/contacts/444');

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Contacto no encontrado.');
    });
  });

});