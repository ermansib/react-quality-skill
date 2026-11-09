import { fireEvent, render, screen } from '@testing-library/react';

import { BadCart } from './BadCart';

it.only('clears the cart', () => {
  render(<BadCart items={[]} />);
  fireEvent.click(screen.getByTestId('clear'));
});
