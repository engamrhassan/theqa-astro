import type { Broker } from '../../schemas/broker';
import type { BrokerListParams, BrokerListResponse } from '../../api/brokers/types';

/**
 * Broker Store State
 */
export interface BrokerState {
  brokers: Broker[];
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
  total: number;
  hasMore: boolean;
  filters: BrokerListParams;
}

/**
 * Broker Store Actions
 */
export interface BrokerActions {
  setBrokers: (brokers: Broker[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTotal: (total: number) => void;
  setHasMore: (hasMore: boolean) => void;
  setFilters: (filters: BrokerListParams) => void;
  addBroker: (broker: Broker) => void;
  updateBroker: (id: number, updates: Partial<Broker>) => void;
  removeBroker: (id: number) => void;
  clearBrokers: () => void;
  reset: () => void;
}

/**
 * Broker Store
 */
export class BrokerStore implements BrokerState, BrokerActions {
  brokers: Broker[] = [];
  loading = false;
  error: string | null = null;
  lastFetch: number | null = null;
  total = 0;
  hasMore = false;
  filters: BrokerListParams = {};

  private listeners: Set<() => void> = new Set();

  /**
   * Subscribe to store changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners
   */
  private notify(): void {
    this.listeners.forEach(listener => listener());
  }

  /**
   * Set brokers
   */
  setBrokers(brokers: Broker[]): void {
    this.brokers = brokers;
    this.lastFetch = Date.now();
    this.notify();
  }

  /**
   * Set loading state
   */
  setLoading(loading: boolean): void {
    this.loading = loading;
    this.notify();
  }

  /**
   * Set error state
   */
  setError(error: string | null): void {
    this.error = error;
    this.notify();
  }

  /**
   * Set total count
   */
  setTotal(total: number): void {
    this.total = total;
    this.notify();
  }

  /**
   * Set has more flag
   */
  setHasMore(hasMore: boolean): void {
    this.hasMore = hasMore;
    this.notify();
  }

  /**
   * Set filters
   */
  setFilters(filters: BrokerListParams): void {
    this.filters = { ...this.filters, ...filters };
    this.notify();
  }

  /**
   * Add broker
   */
  addBroker(broker: Broker): void {
    this.brokers.push(broker);
    this.total += 1;
    this.notify();
  }

  /**
   * Update broker
   */
  updateBroker(id: number, updates: Partial<Broker>): void {
    const index = this.brokers.findIndex(broker => broker.id === id);
    if (index !== -1) {
      this.brokers[index] = { ...this.brokers[index], ...updates };
      this.notify();
    }
  }

  /**
   * Remove broker
   */
  removeBroker(id: number): void {
    const index = this.brokers.findIndex(broker => broker.id === id);
    if (index !== -1) {
      this.brokers.splice(index, 1);
      this.total = Math.max(0, this.total - 1);
      this.notify();
    }
  }

  /**
   * Clear all brokers
   */
  clearBrokers(): void {
    this.brokers = [];
    this.total = 0;
    this.hasMore = false;
    this.error = null;
    this.notify();
  }

  /**
   * Reset store to initial state
   */
  reset(): void {
    this.brokers = [];
    this.loading = false;
    this.error = null;
    this.lastFetch = null;
    this.total = 0;
    this.hasMore = false;
    this.filters = {};
    this.notify();
  }

  /**
   * Get broker by ID
   */
  getBrokerById(id: number): Broker | undefined {
    return this.brokers.find(broker => broker.id === id);
  }

  /**
   * Get brokers by country
   */
  getBrokersByCountry(countryCode: string): Broker[] {
    return this.brokers.filter(broker => 
      broker.country_codes?.includes(countryCode)
    );
  }

  /**
   * Get top rated brokers
   */
  getTopRatedBrokers(limit = 10): Broker[] {
    return [...this.brokers]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  /**
   * Get beginner friendly brokers
   */
  getBeginnerBrokers(limit = 10): Broker[] {
    return [...this.brokers]
      .sort((a, b) => a.min_deposit - b.min_deposit)
      .slice(0, limit);
  }

  /**
   * Check if data is stale
   */
  isDataStale(maxAge = 5 * 60 * 1000): boolean {
    if (!this.lastFetch) return true;
    return Date.now() - this.lastFetch > maxAge;
  }

  /**
   * Get current state
   */
  getState(): BrokerState {
    return {
      brokers: this.brokers,
      loading: this.loading,
      error: this.error,
      lastFetch: this.lastFetch,
      total: this.total,
      hasMore: this.hasMore,
      filters: this.filters,
    };
  }
}

/**
 * Global broker store instance
 */
export const brokerStore = new BrokerStore();
