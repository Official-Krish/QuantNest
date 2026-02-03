import {WebSocket, RawData} from 'ws';
import { Configuration } from './generated';

interface Subscriptions {
  order_books: string[];
  accounts: string[];
}

interface OrderBook {
  asks: Order[];
  bids: Order[];
}

interface Order {
  price: string;
  size: string;
}

interface Message {
  type: string;
  channel?: string;
  order_book?: OrderBook;
  [key: string]: any;
}

type OrderBookUpdateCallback = (marketId: string, orderBook: OrderBook) => void;
type AccountUpdateCallback = (accountId: string, accountState: Message) => void;

export class WsClient {
  private baseUrl: string;
  private subscriptions: Subscriptions;
  private orderBookStates: Record<string, OrderBookState>;
  private accountStates: Record<string, Message>;
  private onOrderBookUpdate: OrderBookUpdateCallback;
  private onAccountUpdate: AccountUpdateCallback;
  private ws: WebSocket | null;

  constructor({
    host = null,
    path = '/stream',
    orderBookIds = [],
    accountIds = [],
    onOrderBookUpdate = console.log,
    onAccountUpdate = console.log,
  }: {
    host?: string | null;
    path?: string;
    orderBookIds?: string[];
    accountIds?: string[];
    onOrderBookUpdate?: OrderBookUpdateCallback;
    onAccountUpdate?: AccountUpdateCallback;
  } = {}) {
    if (host === null) {
      host = 'mainnet.zklighter.elliot.ai';
    }

    this.baseUrl = `wss://${host}${path}`;

    this.subscriptions = {
      order_books: orderBookIds,
      accounts: accountIds,
    };

    if (orderBookIds.length === 0 && accountIds.length === 0) {
      throw new Error('No subscriptions provided.');
    }

    this.orderBookStates = {};
    this.accountStates = {};

    this.onOrderBookUpdate = onOrderBookUpdate;
    this.onAccountUpdate = onAccountUpdate;

    this.ws = null;
  }

  private onMessage(ws: WebSocket, message: string | Message): void {
    let parsedMessage: Message;
    
    if (typeof message === 'string') {
      parsedMessage = JSON.parse(message);
    } else {
      parsedMessage = message;
    }

    const messageType = parsedMessage.type;

    if (messageType === 'connected') {
      this.handleConnected(ws);
    } else if (messageType === 'subscribed/order_book') {
      this.handleSubscribedOrderBook(parsedMessage);
    } else if (messageType === 'update/order_book') {
      this.handleUpdateOrderBook(parsedMessage);
    } else if (messageType === 'subscribed/account_all') {
      this.handleSubscribedAccount(parsedMessage);
    } else if (messageType === 'update/account_all') {
      this.handleUpdateAccount(parsedMessage);
    } else if (messageType === 'ping') {
      // Respond to ping with pong
      ws.send(JSON.stringify({ type: 'pong' }));
    } else {
      this.handleUnhandledMessage(parsedMessage);
    }
  }

  private handleConnected(ws: WebSocket): void {
    for (const marketId of this.subscriptions.order_books) {
      ws.send(
        JSON.stringify({ type: 'subscribe', channel: `order_book/${marketId}` })
      );
    }
    for (const accountId of this.subscriptions.accounts) {
      ws.send(
        JSON.stringify({
          type: 'subscribe',
          channel: `account_all/${accountId}`,
        })
      );
    }
  }

  private handleSubscribedOrderBook(message: Message): void {
    const channel = message.channel;
    if (!channel) {
      this.handleUnhandledMessage(message);
      return;
    }
    const parts = channel.split(':');
    if (parts.length < 2) {
      this.handleUnhandledMessage(message);
      return;
    }
    const marketId = parts[1]!;
    const state = new OrderBookState();
    state.applySnapshot(message.order_book!);
    this.orderBookStates[marketId] = state;
    if (this.onOrderBookUpdate) {
      this.onOrderBookUpdate(marketId, state.toOrderBook());
    }
  }

  private handleUpdateOrderBook(message: Message): void {
    const channel = message.channel;
    if (!channel) {
      this.handleUnhandledMessage(message);
      return;
    }
    const parts = channel.split(':');
    if (parts.length < 2) {
      this.handleUnhandledMessage(message);
      return;
    }
    const marketId = parts[1]!;
    this.updateOrderBookState(marketId, message.order_book!);

    const state = this.orderBookStates[marketId];
    if (this.onOrderBookUpdate && state) {
      this.onOrderBookUpdate(marketId, state.toOrderBook());
    }
  }

  private updateOrderBookState(marketId: string, orderBook: OrderBook): void {
    const state = this.orderBookStates[marketId];
    if (!state) {
      const newState = new OrderBookState();
      newState.applySnapshot(orderBook);
      this.orderBookStates[marketId] = newState;
      return;
    }
    state.applyUpdate(orderBook);
  }

  private handleSubscribedAccount(message: Message): void {
    const channel = message.channel;
    if (!channel) {
      this.handleUnhandledMessage(message);
      return;
    }
    const parts = channel.split(':');
    if (parts.length < 2) {
      this.handleUnhandledMessage(message);
      return;
    }
    const accountId = parts[1]!;
    this.accountStates[accountId] = message;
    const stateMsg = this.accountStates[accountId];
    if (this.onAccountUpdate && stateMsg) {
      this.onAccountUpdate(accountId, stateMsg);
    }
  }

  private handleUpdateAccount(message: Message): void {
    const channel = message.channel;
    if (!channel) {
      this.handleUnhandledMessage(message);
      return;
    }
    const parts = channel.split(':');
    if (parts.length < 2) {
      this.handleUnhandledMessage(message);
      return;
    }
    const accountId = parts[1]!;
    this.accountStates[accountId] = message;
    const stateMsg = this.accountStates[accountId];
    if (this.onAccountUpdate && stateMsg) {
      this.onAccountUpdate(accountId, stateMsg);
    }
  }

  private handleUnhandledMessage(message: Message): void {
    // throw new Error(`Unhandled message: ${JSON.stringify(message)}`);
    console.log(`Unhandled message: ${JSON.stringify(message)}`);
  }

  private onError(ws: WebSocket, error: Error): void {
    throw new Error(`Error: ${error.message}`);
  }

  private onClose(ws: WebSocket, code: number, reason: string): void {
    throw new Error(`Closed: ${code} ${reason}`);
  }

  public run(): void {
    const ws = new WebSocket(this.baseUrl);
    this.ws = ws;

    ws.on('open', () => {
      this.handleConnected(ws);
    });

    ws.on('message', (data: RawData) => {
      this.onMessage(ws, data.toString());
    });

    ws.on('error', (error: Error) => {
      this.onError(ws, error);
    });

    ws.on('close', (code: number, reason: string) => {
      this.onClose(ws, code, reason.toString());
    });
  }

  public async runAsync(): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.baseUrl);
      this.ws = ws;

      ws.on('open', () => {
        this.handleConnected(ws);
      });

      ws.on('message', (data: RawData) => {
        try {
          this.onMessage(ws, data.toString());
        } catch (error) {
          reject(error);
        }
      });

      ws.on('error', (error: Error) => {
        reject(error);
      });

      ws.on('close', (code: number, reason: string) => {
        if (code !== 1000) {
          reject(new Error(`Closed: ${code} ${reason.toString()}`));
        } else {
          resolve();
        }
      });
    });
  }

  public getBestBid(marketId: string): Order | null {
    const state = this.orderBookStates[marketId];
    if (!state) return null;
    return state.bestBid();
  }

  public getBestAsk(marketId: string): Order | null {
    const state = this.orderBookStates[marketId];
    if (!state) return null;
    return state.bestAsk();
  }
}

class OrderBookState {
  private asksHeap: PriceLevelHeap;
  private bidsHeap: PriceLevelHeap;

  constructor() {
    this.asksHeap = new PriceLevelHeap('ask');
    this.bidsHeap = new PriceLevelHeap('bid');
  }

  public applySnapshot(book: OrderBook): void {
    this.asksHeap.reset(book.asks);
    this.bidsHeap.reset(book.bids);
  }

  public applyUpdate(update: OrderBook): void {
    for (const o of update.asks) {
      this.asksHeap.set(o.price, o.size);
    }
    for (const o of update.bids) {
      this.bidsHeap.set(o.price, o.size);
    }
  }

  public bestBid(): Order | null {
    return this.bidsHeap.peek();
  }

  public bestAsk(): Order | null {
    return this.asksHeap.peek();
  }

  public toOrderBook(): OrderBook {
    return {
      asks: this.asksHeap.toArray(),
      bids: this.bidsHeap.toArray(),
    };
  }
}

class PriceLevelHeap {
  private prices: string[];
  private indexByPrice: Map<string, number>;
  private sizeByPrice: Map<string, string>;
  private isHigherPriority: (a: string, b: string) => boolean;

  constructor(side: 'bid' | 'ask') {
    this.prices = [];
    this.indexByPrice = new Map();
    this.sizeByPrice = new Map();
    if (side === 'bid') {
      // Higher price has higher priority (max-heap)
      this.isHigherPriority = (a: string, b: string) => parseFloat(a) > parseFloat(b);
    } else {
      // Lower price has higher priority (min-heap)
      this.isHigherPriority = (a: string, b: string) => parseFloat(a) < parseFloat(b);
    }
  }

  public reset(levels: Order[]): void {
    this.prices = [];
    this.indexByPrice.clear();
    this.sizeByPrice.clear();
    for (const { price, size } of levels) {
      if (parseFloat(size) <= 0) continue;
      this.insert(price, size);
    }
  }

  public set(price: string, size: string): void {
    if (parseFloat(size) <= 0) {
      this.remove(price);
      return;
    }
    if (this.indexByPrice.has(price)) {
      this.sizeByPrice.set(price, size);
      return;
    }
    this.insert(price, size);
  }

  public peek(): Order | null {
    if (this.prices.length === 0) return null;
    const topPrice = this.prices[0]!;
    const size = this.sizeByPrice.get(topPrice);
    if (size === undefined) return null;
    return { price: topPrice, size };
  }

  public toArray(): Order[] {
    const result: Order[] = [];
    for (const [price, size] of this.sizeByPrice.entries()) {
      if (parseFloat(size) > 0) {
        result.push({ price, size });
      }
    }
    return result;
  }

  private insert(price: string, size: string): void {
    this.prices.push(price);
    const idx = this.prices.length - 1;
    this.indexByPrice.set(price, idx);
    this.sizeByPrice.set(price, size);
    this.siftUp(idx);
  }

  private remove(price: string): void {
    const idx = this.indexByPrice.get(price);
    if (idx === undefined) return;
    const lastIdx = this.prices.length - 1;
    this.swap(idx, lastIdx);
    // Remove last
    const removed = this.prices.pop();
    if (removed !== undefined) {
      this.indexByPrice.delete(removed);
      this.sizeByPrice.delete(removed);
    }
    if (idx < this.prices.length) {
      // Re-heapify at position idx
      this.siftUp(idx);
      this.siftDown(idx);
    }
  }

  private siftUp(i: number): void {
    let index = i;
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      const childPrice = this.prices[index]!;
      const parentPrice = this.prices[parent]!;
      if (this.isHigherPriority(childPrice, parentPrice)) {
        this.swap(index, parent);
        index = parent;
      } else {
        break;
      }
    }
  }

  private siftDown(i: number): void {
    let index = i;
    const n = this.prices.length;
    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let best = index;
      if (left < n) {
        const leftPrice = this.prices[left]!;
        const bestPrice = this.prices[best]!;
        if (this.isHigherPriority(leftPrice, bestPrice)) {
          best = left;
        }
      }
      if (right < n) {
        const rightPrice = this.prices[right]!;
        const bestPrice2 = this.prices[best]!;
        if (this.isHigherPriority(rightPrice, bestPrice2)) {
          best = right;
        }
      }
      if (best !== index) {
        this.swap(index, best);
        index = best;
      } else {
        break;
      }
    }
  }

  private swap(i: number, j: number): void {
    if (i === j) return;
    const pi = this.prices[i]!;
    const pj = this.prices[j]!;
    this.prices[i] = pj;
    this.prices[j] = pi;
    this.indexByPrice.set(pj, i);
    this.indexByPrice.set(pi, j);
  }
}