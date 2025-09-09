import { apiClient } from '../shared/client';
import { ErrorHandler } from '../shared/errors';
import type {
  BrokerListParams,
  BrokerListResponse,
  BrokerDetailsParams,
  BrokerDetailsResponse,
  CountryBrokerSorting,
  BrokerComparison,
  BrokerSearchParams,
  BrokerSearchResponse,
} from './types';
import { BrokerSchema, CountrySortingSchema } from '../../schemas/broker';

/**
 * Broker API Service
 */
export class BrokerAPI {
  private client = apiClient;

  /**
   * Get list of brokers
   */
  async getBrokers(params: BrokerListParams = {}): Promise<BrokerListResponse> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.country) searchParams.set('country', params.country);
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.offset) searchParams.set('offset', params.offset.toString());
      if (params.sort) searchParams.set('sort', params.sort);
      if (params.order) searchParams.set('order', params.order);

      const endpoint = `/brokers?${searchParams.toString()}`;
      const response = await this.client.get<BrokerListResponse>(endpoint);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch brokers');
      }

      // Validate broker data
      const validatedBrokers = response.data.brokers.map(broker => 
        BrokerSchema.parse(broker)
      );

      return {
        ...response.data,
        brokers: validatedBrokers,
      };
    } catch (error) {
      ErrorHandler.handleAPIError(error);
    }
  }

  /**
   * Get broker details
   */
  async getBrokerDetails(params: BrokerDetailsParams): Promise<BrokerDetailsResponse> {
    try {
      const { id, country } = params;
      const searchParams = new URLSearchParams();
      
      if (country) searchParams.set('country', country);
      
      const endpoint = `/brokers/${id}?${searchParams.toString()}`;
      const response = await this.client.get<BrokerDetailsResponse>(endpoint);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch broker details');
      }

      // Validate broker data
      const validatedBroker = BrokerSchema.parse(response.data);

      return {
        ...response.data,
        ...validatedBroker,
      };
    } catch (error) {
      ErrorHandler.handleAPIError(error);
    }
  }

  /**
   * Get country-specific broker sorting
   */
  async getCountryBrokerSorting(countryCode: string): Promise<CountryBrokerSorting> {
    try {
      const endpoint = `/brokers/sorting/${countryCode}`;
      const response = await this.client.get<CountryBrokerSorting>(endpoint);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch country sorting');
      }

      // Validate sorting data
      const validatedSorting = response.data.brokers.map(sorting =>
        CountrySortingSchema.parse(sorting)
      );

      return {
        ...response.data,
        brokers: validatedSorting,
      };
    } catch (error) {
      ErrorHandler.handleAPIError(error);
    }
  }

  /**
   * Compare brokers
   */
  async compareBrokers(brokerIds: number[]): Promise<BrokerComparison> {
    try {
      const searchParams = new URLSearchParams();
      brokerIds.forEach(id => searchParams.append('ids', id.toString()));
      
      const endpoint = `/brokers/compare?${searchParams.toString()}`;
      const response = await this.client.get<BrokerComparison>(endpoint);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to compare brokers');
      }

      // Validate broker data
      const validatedBrokers = response.data.brokers.map(broker =>
        BrokerSchema.parse(broker)
      );

      return {
        ...response.data,
        brokers: validatedBrokers,
      };
    } catch (error) {
      ErrorHandler.handleAPIError(error);
    }
  }

  /**
   * Search brokers
   */
  async searchBrokers(params: BrokerSearchParams): Promise<BrokerSearchResponse> {
    try {
      const searchParams = new URLSearchParams();
      searchParams.set('q', params.query);
      
      if (params.country) searchParams.set('country', params.country);
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.offset) searchParams.set('offset', params.offset.toString());
      
      if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.set(`filter_${key}`, value.toString());
          }
        });
      }

      const endpoint = `/brokers/search?${searchParams.toString()}`;
      const response = await this.client.get<BrokerSearchResponse>(endpoint);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to search brokers');
      }

      // Validate broker data
      const validatedBrokers = response.data.brokers.map(broker =>
        BrokerSchema.parse(broker)
      );

      return {
        ...response.data,
        brokers: validatedBrokers,
      };
    } catch (error) {
      ErrorHandler.handleAPIError(error);
    }
  }

  /**
   * Get popular brokers for country
   */
  async getPopularBrokers(countryCode: string, limit = 10): Promise<Broker[]> {
    try {
      const response = await this.getBrokers({
        country: countryCode,
        sort: 'rating',
        order: 'desc',
        limit,
      });

      return response.brokers;
    } catch (error) {
      ErrorHandler.handleAPIError(error);
    }
  }

  /**
   * Get beginner-friendly brokers for country
   */
  async getBeginnerBrokers(countryCode: string, limit = 10): Promise<Broker[]> {
    try {
      const response = await this.getBrokers({
        country: countryCode,
        sort: 'min_deposit',
        order: 'asc',
        limit,
      });

      return response.brokers;
    } catch (error) {
      ErrorHandler.handleAPIError(error);
    }
  }
}

/**
 * Default broker API instance
 */
export const brokerAPI = new BrokerAPI();
