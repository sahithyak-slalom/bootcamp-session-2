const request = require('supertest');
const { app, db } = require('../../src/app');

afterAll(() => {
  if (db) {
    db.close();
  }
});

// Helper: create an item and return the full response body
const createItem = async (name = 'Integration Test Item') => {
  const response = await request(app)
    .post('/api/items')
    .send({ name })
    .set('Accept', 'application/json');

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('id');
  return response.body;
};

describe('Integration: GET /api/items', () => {
  it('returns a 200 with an array containing the seeded items', async () => {
    const response = await request(app).get('/api/items');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(3);
  });

  it('each item has id, name, completed and created_at fields', async () => {
    const response = await request(app).get('/api/items');

    response.body.forEach(item => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('completed');
      expect(item).toHaveProperty('created_at');
    });
  });

  it('newly created items appear in the list', async () => {
    const created = await createItem('Item That Should Appear In List');
    const response = await request(app).get('/api/items');

    const found = response.body.find(i => i.id === created.id);
    expect(found).toBeDefined();
    expect(found.name).toBe('Item That Should Appear In List');
  });
});

describe('Integration: POST /api/items', () => {
  it('creates an item and persists it in the database', async () => {
    const created = await createItem('Persisted Item');

    expect(created.name).toBe('Persisted Item');
    expect(created.completed).toBe(0);
    expect(created).toHaveProperty('created_at');

    // Verify it actually exists in the DB via GET
    const all = await request(app).get('/api/items');
    const found = all.body.find(i => i.id === created.id);
    expect(found).toBeDefined();
  });

  it('returns 400 and does not create an item when name is missing', async () => {
    const before = (await request(app).get('/api/items')).body.length;

    const response = await request(app)
      .post('/api/items')
      .send({})
      .set('Accept', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Item name is required');

    const after = (await request(app).get('/api/items')).body.length;
    expect(after).toBe(before);
  });

  it('returns 400 and does not create an item when name is whitespace only', async () => {
    const before = (await request(app).get('/api/items')).body.length;

    const response = await request(app)
      .post('/api/items')
      .send({ name: '   ' })
      .set('Accept', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Item name is required');

    const after = (await request(app).get('/api/items')).body.length;
    expect(after).toBe(before);
  });
});

describe('Integration: DELETE /api/items/:id', () => {
  it('deletes an item and removes it from the database', async () => {
    const created = await createItem('Item To Delete');

    const deleteResponse = await request(app).delete(`/api/items/${created.id}`);
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toEqual({
      message: 'Item deleted successfully',
      id: created.id,
    });

    // Verify it no longer appears in GET
    const all = await request(app).get('/api/items');
    const found = all.body.find(i => i.id === created.id);
    expect(found).toBeUndefined();
  });

  it('returns 404 when the item does not exist', async () => {
    const response = await request(app).delete('/api/items/999999');
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Item not found');
  });

  it('returns 400 for a non-numeric id', async () => {
    const response = await request(app).delete('/api/items/not-a-number');
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Valid item ID is required');
  });
});

describe('Integration: PATCH /api/items/:id', () => {
  it('marks an item as completed and reflects the change in the database', async () => {
    const created = await createItem('Item To Complete');
    expect(created.completed).toBe(0);

    const patchResponse = await request(app)
      .patch(`/api/items/${created.id}`)
      .send({ completed: true })
      .set('Accept', 'application/json');

    expect(patchResponse.status).toBe(200);
    expect(patchResponse.body.completed).toBe(1);

    // Verify DB state via GET
    const all = await request(app).get('/api/items');
    const found = all.body.find(i => i.id === created.id);
    expect(found.completed).toBe(1);
  });

  it('toggles a completed item back to active and reflects the change in the database', async () => {
    const created = await createItem('Item To Toggle');

    await request(app)
      .patch(`/api/items/${created.id}`)
      .send({ completed: true });

    const patchResponse = await request(app)
      .patch(`/api/items/${created.id}`)
      .send({ completed: false })
      .set('Accept', 'application/json');

    expect(patchResponse.status).toBe(200);
    expect(patchResponse.body.completed).toBe(0);

    const all = await request(app).get('/api/items');
    const found = all.body.find(i => i.id === created.id);
    expect(found.completed).toBe(0);
  });

  it('returns 400 when completed is not a boolean', async () => {
    const created = await createItem('Item For Bad Patch');

    const response = await request(app)
      .patch(`/api/items/${created.id}`)
      .send({ completed: 'yes' })
      .set('Accept', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'completed must be a boolean');
  });

  it('returns 404 when the item does not exist', async () => {
    const response = await request(app)
      .patch('/api/items/999999')
      .send({ completed: true });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Item not found');
  });

  it('returns 400 for a non-numeric id', async () => {
    const response = await request(app)
      .patch('/api/items/not-a-number')
      .send({ completed: true });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Valid item ID is required');
  });
});

describe('Integration: PUT /api/items/:id', () => {
  it('renames an item and reflects the change in the database', async () => {
    const created = await createItem('Original Name');

    const putResponse = await request(app)
      .put(`/api/items/${created.id}`)
      .send({ name: 'Updated Name' })
      .set('Accept', 'application/json');

    expect(putResponse.status).toBe(200);
    expect(putResponse.body.name).toBe('Updated Name');
    expect(putResponse.body.id).toBe(created.id);

    // Verify DB state via GET
    const all = await request(app).get('/api/items');
    const found = all.body.find(i => i.id === created.id);
    expect(found.name).toBe('Updated Name');
  });

  it('trims whitespace from the updated name', async () => {
    const created = await createItem('Untrimmed Item');

    const putResponse = await request(app)
      .put(`/api/items/${created.id}`)
      .send({ name: '  Trimmed Name  ' })
      .set('Accept', 'application/json');

    expect(putResponse.status).toBe(200);
    expect(putResponse.body.name).toBe('Trimmed Name');
  });

  it('returns 400 when name is missing', async () => {
    const created = await createItem('Item For Missing Name');

    const response = await request(app)
      .put(`/api/items/${created.id}`)
      .send({})
      .set('Accept', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Item name is required');
  });

  it('returns 400 when name is whitespace only', async () => {
    const created = await createItem('Item For Blank Name');

    const response = await request(app)
      .put(`/api/items/${created.id}`)
      .send({ name: '   ' })
      .set('Accept', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Item name is required');
  });

  it('returns 404 when the item does not exist', async () => {
    const response = await request(app)
      .put('/api/items/999999')
      .send({ name: 'Ghost Item' });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Item not found');
  });

  it('returns 400 for a non-numeric id', async () => {
    const response = await request(app)
      .put('/api/items/not-a-number')
      .send({ name: 'Some Name' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Valid item ID is required');
  });
});

describe('Integration: GET / (health check)', () => {
  it('returns 200 with status ok', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('message');
  });
});
