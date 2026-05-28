const express = require('express');
const app = express();

app.use(express.json());

let contacts = [];
let nextId = 1;


function resetContacts() {
  contacts = [
    { id: 1, name: 'Samuel Mahecha', email: 'samuel@sena.edu.co', phone: '3001234567' },
    { id: 2, name: 'Instructor SENA', email: 'instructor@sena.edu.co' }
  ];
  nextId = 3;
}

resetContacts();


app.get('/api/contacts', (req, res) => {
  res.status(200).json(contacts);
});


app.get('/api/contacts/:id', (req, res) => {
  const contact = contacts.find(c => c.id === Number(req.params.id));
  if (!contact) {
    return res.status(404).json({ error: 'Contacto no encontrado.' });
  }
  res.status(200).json(contact);
});


app.post('/api/contacts', (req, res) => {
  const { name, email, phone } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'El campo name es requerido.' });
  }
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'El email es requerido y debe contener un @.' });
  }

  const newContact = {
    id: nextId++,
    name: name.trim(),
    email: email.trim(),
    phone: phone ? phone.trim() : undefined
  };

  contacts.push(newContact);
  res.status(201).json(newContact);
});


app.put('/api/contacts/:id', (req, res) => {
  const contact = contacts.find(c => c.id === Number(req.params.id));
  if (!contact) {
    return res.status(404).json({ error: 'Contacto no encontrado.' });
  }

  if (req.body.name !== undefined) contact.name = req.body.name.trim();
  
  if (req.body.email !== undefined) {
    if (!req.body.email.includes('@')) {
      return res.status(400).json({ error: 'El email debe contener un @.' });
    }
    contact.email = req.body.email.trim();
  }
  
  if (req.body.phone !== undefined) contact.phone = req.body.phone.trim();

  res.status(200).json(contact);
});


app.delete('/api/contacts/:id', (req, res) => {
  const contactIndex = contacts.findIndex(c => c.id === Number(req.params.id));
  
  if (contactIndex === -1) {
    return res.status(404).json({ error: 'Contacto no encontrado.' });
  }

  contacts.splice(contactIndex, 1);
  res.status(200).json({ message: 'Contacto eliminado.' });
});

module.exports = { app, resetContacts };