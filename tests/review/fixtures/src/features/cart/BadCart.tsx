// Deliberately breaks react-quality rules. Used by tests/review/scan.test.mjs.
import React, { forwardRef, useEffect, useState } from 'react';

import { UserAvatar } from '@/features/users/components/UserAvatar';

interface ICartItem {
  id: string;
  price: number;
}

interface CartProps {
  items: any[];
}

type CartTotal = { value: number };

enum Status {
  Idle,
  Done,
}

export const BadCart: React.FC<CartProps> = ({ items }) => {
  const [data, setData] = useState<ICartItem[]>([]);
  const token = localStorage.setItem('authToken', 'abc');

  useEffect(() => {
    fetch('/api/cart')
      .then((response) => response.json())
      .then(setData)
      .catch(() => {});
  }, []);

  try {
    JSON.parse('{}');
  } catch {}

  // @ts-ignore
  console.log(token, Status.Idle);
  const total = JSON.parse('1') as CartTotal;
  const first = data[0]!.price;

  return (
    <div onClick={() => setData([])}>
      {items.length && (
        <span>
          {first}
          {total.value}
        </span>
      )}
      {data.map((item, index) => (
        <p key={index}>{item.id}</p>
      ))}
      {data.map((item) => (
        <p key={Math.random()}>{item.id}</p>
      ))}
      <img src="/logo.png" />
      <a href="https://example.com" target="_blank">
        Docs
      </a>
      <div dangerouslySetInnerHTML={{ __html: String(items[0]) }} />
      <button onClick={() => setData([])}>Clear</button>
      <UserAvatar />
    </div>
  );
};

export const Input = forwardRef<HTMLInputElement>((props, ref) => <input ref={ref} {...props} />);

export default BadCart;
