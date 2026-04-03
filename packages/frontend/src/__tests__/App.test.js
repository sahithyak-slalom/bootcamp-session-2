import React, { act } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../App';

const seedItems = [
  { id: 1, name: 'Test Item 1', completed: 0, created_at: '2023-01-01T00:00:00.000Z' },
  { id: 2, name: 'Test Item 2', completed: 0, created_at: '2023-01-02T00:00:00.000Z' },
];

// Mock server to intercept API requests
const server = setupServer(
  rest.get('/api/items', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(seedItems));
  }),

  rest.post('/api/items', (req, res, ctx) => {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res(ctx.status(400), ctx.json({ error: 'Item name is required' }));
    }

    return res(
      ctx.status(201),
      ctx.json({ id: 3, name, completed: 0, created_at: new Date().toISOString() })
    );
  }),

  rest.delete('/api/items/:id', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ message: 'Item deleted successfully', id: parseInt(req.params.id) }));
  }),

  rest.patch('/api/items/:id', (req, res, ctx) => {
    const { completed } = req.body;
    const id = parseInt(req.params.id);
    const item = seedItems.find(i => i.id === id);

    if (!item) {
      return res(ctx.status(404), ctx.json({ error: 'Item not found' }));
    }

    return res(ctx.status(200), ctx.json({ ...item, completed: completed ? 1 : 0 }));
  }),

  rest.put('/api/items/:id', (req, res, ctx) => {
    const { name } = req.body;
    const id = parseInt(req.params.id);
    const item = seedItems.find(i => i.id === id);

    if (!item) {
      return res(ctx.status(404), ctx.json({ error: 'Item not found' }));
    }

    return res(ctx.status(200), ctx.json({ ...item, name }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('App Component', () => {
  test('renders the header', async () => {
    await act(async () => {
      render(<App />);
    });
    expect(screen.getByText('To Do App')).toBeInTheDocument();
    expect(screen.getByText('Keep track of your tasks')).toBeInTheDocument();
  });

  test('loads and displays items', async () => {
    await act(async () => {
      render(<App />);
    });

    expect(screen.getByText('Loading data...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      expect(screen.getByText('Test Item 2')).toBeInTheDocument();
    });
  });

  test('adds a new item', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Enter item name');
    await act(async () => {
      await user.type(input, 'New Test Item');
    });

    const submitButton = screen.getByText('Add Item');
    await act(async () => {
      await user.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText('New Test Item')).toBeInTheDocument();
    });
  });

  test('deletes an item', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');
    await act(async () => {
      await user.click(deleteButtons[0]);
    });

    await waitFor(() => {
      expect(screen.queryByText('Test Item 1')).not.toBeInTheDocument();
    });
  });

  test('marks an item as completed', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    await act(async () => {
      await user.click(checkboxes[0]);
    });

    await waitFor(() => {
      const item = screen.getByText('Test Item 1').closest('li');
      expect(item).toHaveClass('completed');
    });
  });

  test('edits an item name', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Edit');
    await act(async () => {
      await user.click(editButtons[0]);
    });

    const editInput = screen.getByDisplayValue('Test Item 1');
    await act(async () => {
      await user.clear(editInput);
      await user.type(editInput, 'Renamed Item');
    });

    const saveButton = screen.getByText('Save');
    await act(async () => {
      await user.click(saveButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Renamed Item')).toBeInTheDocument();
      expect(screen.queryByText('Test Item 1')).not.toBeInTheDocument();
    });
  });

  test('cancels editing an item', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Edit');
    await act(async () => {
      await user.click(editButtons[0]);
    });

    const cancelButton = screen.getByText('Cancel');
    await act(async () => {
      await user.click(cancelButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      expect(screen.queryByText('Save')).not.toBeInTheDocument();
    });
  });

  test('filters items by active', async () => {
    server.use(
      rest.get('/api/items', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json([
          { id: 1, name: 'Active Item', completed: 0, created_at: '2023-01-01T00:00:00.000Z' },
          { id: 2, name: 'Done Item', completed: 1, created_at: '2023-01-02T00:00:00.000Z' },
        ]));
      })
    );

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('Active Item')).toBeInTheDocument();
    });

    const activeFilter = screen.getByText('Active');
    await act(async () => {
      await userEvent.setup().click(activeFilter);
    });

    await waitFor(() => {
      expect(screen.getByText('Active Item')).toBeInTheDocument();
      expect(screen.queryByText('Done Item')).not.toBeInTheDocument();
    });
  });

  test('filters items by completed', async () => {
    server.use(
      rest.get('/api/items', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json([
          { id: 1, name: 'Active Item', completed: 0, created_at: '2023-01-01T00:00:00.000Z' },
          { id: 2, name: 'Done Item', completed: 1, created_at: '2023-01-02T00:00:00.000Z' },
        ]));
      })
    );

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('Done Item')).toBeInTheDocument();
    });

    const completedFilter = screen.getByText('Completed');
    await act(async () => {
      await userEvent.setup().click(completedFilter);
    });

    await waitFor(() => {
      expect(screen.getByText('Done Item')).toBeInTheDocument();
      expect(screen.queryByText('Active Item')).not.toBeInTheDocument();
    });
  });

  test('displays correct item count', async () => {
    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('2 items left')).toBeInTheDocument();
    });
  });

  test('handles API error', async () => {
    server.use(
      rest.get('/api/items', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch data/)).toBeInTheDocument();
    });
  });

  test('shows empty state when no items', async () => {
    server.use(
      rest.get('/api/items', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json([]));
      })
    );

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('No items found. Add some!')).toBeInTheDocument();
    });
  });
});
