import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

describe("Render", () => {
    test('renders without crashing', () => {
    render(<App />);
    });
})
