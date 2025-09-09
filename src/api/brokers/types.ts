import type { Broker, CountrySorting } from '../../schemas/broker';

/**
 * Broker API Types
 */
export interface BrokerListParams {
  country?: string;
  limit?: number;
  offset?: number;
  sort?: 'rating' | 'name' | 'min_deposit';
  order?: 'asc' | 'desc';
}

export interface BrokerListResponse {
  brokers: Broker[];
  total: number;
  hasMore: boolean;
}

export interface BrokerDetailsParams {
  id: number;
  country?: string;
}

export interface BrokerDetailsResponse extends Broker {
  description?: string;
  features?: string[];
  pros?: string[];
  cons?: string[];
  regulation?: string[];
  tradingPlatforms?: string[];
  accountTypes?: string[];
  depositMethods?: string[];
  withdrawalMethods?: string[];
  customerSupport?: string[];
  education?: string[];
  research?: string[];
}

/**
 * Country-specific broker sorting
 */
export interface CountryBrokerSorting {
  countryCode: string;
  brokers: CountrySorting[];
  lastUpdated: string;
}

/**
 * Broker comparison
 */
export interface BrokerComparison {
  brokers: Broker[];
  comparison: {
    [key: string]: {
      [brokerId: number]: string | number | boolean;
    };
  };
}

/**
 * Broker search
 */
export interface BrokerSearchParams {
  query: string;
  country?: string;
  filters?: {
    minRating?: number;
    maxMinDeposit?: number;
    hasLicense?: boolean;
    isRestricted?: boolean;
  };
  limit?: number;
  offset?: number;
}

export interface BrokerSearchResponse {
  brokers: Broker[];
  total: number;
  query: string;
  filters: BrokerSearchParams['filters'];
}
