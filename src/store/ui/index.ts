/**
 * UI Store State
 */
export interface UIState {
  theme: 'light' | 'dark' | 'auto';
  sidebarOpen: boolean;
  modalOpen: boolean;
  modalContent: string | null;
  toast: {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration: number;
  } | null;
  loading: {
    global: boolean;
    brokers: boolean;
    search: boolean;
  };
  searchQuery: string;
  searchFilters: Record<string, unknown>;
  selectedBrokers: number[];
  comparisonMode: boolean;
}

/**
 * UI Store Actions
 */
export interface UIActions {
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setSidebarOpen: (open: boolean) => void;
  setModalOpen: (open: boolean) => void;
  setModalContent: (content: string | null) => void;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
  hideToast: () => void;
  setLoading: (key: keyof UIState['loading'], loading: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSearchFilters: (filters: Record<string, unknown>) => void;
  addSelectedBroker: (id: number) => void;
  removeSelectedBroker: (id: number) => void;
  clearSelectedBrokers: () => void;
  setComparisonMode: (enabled: boolean) => void;
  reset: () => void;
}

/**
 * UI Store
 */
export class UIStore implements UIState, UIActions {
  theme: 'light' | 'dark' | 'auto' = 'auto';
  sidebarOpen = false;
  modalOpen = false;
  modalContent: string | null = null;
  toast: UIState['toast'] = null;
  loading: UIState['loading'] = {
    global: false,
    brokers: false,
    search: false,
  };
  searchQuery = '';
  searchFilters: Record<string, unknown> = {};
  selectedBrokers: number[] = [];
  comparisonMode = false;

  private listeners: Set<() => void> = new Set();
  private toastTimeout: number | null = null;

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
   * Set theme
   */
  setTheme(theme: 'light' | 'dark' | 'auto'): void {
    this.theme = theme;
    this.applyTheme();
    this.notify();
  }

  /**
   * Apply theme to document
   */
  private applyTheme(): void {
    const root = document.documentElement;
    
    if (this.theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', this.theme === 'dark');
    }
  }

  /**
   * Set sidebar open state
   */
  setSidebarOpen(open: boolean): void {
    this.sidebarOpen = open;
    this.notify();
  }

  /**
   * Set modal open state
   */
  setModalOpen(open: boolean): void {
    this.modalOpen = open;
    if (!open) {
      this.modalContent = null;
    }
    this.notify();
  }

  /**
   * Set modal content
   */
  setModalContent(content: string | null): void {
    this.modalContent = content;
    this.notify();
  }

  /**
   * Show toast notification
   */
  showToast(
    message: string,
    type: 'success' | 'error' | 'warning' | 'info',
    duration = 5000
  ): void {
    // Clear existing toast
    this.hideToast();

    this.toast = { message, type, duration };
    this.notify();

    // Auto-hide toast
    this.toastTimeout = window.setTimeout(() => {
      this.hideToast();
    }, duration);
  }

  /**
   * Hide toast notification
   */
  hideToast(): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
      this.toastTimeout = null;
    }
    this.toast = null;
    this.notify();
  }

  /**
   * Set loading state
   */
  setLoading(key: keyof UIState['loading'], loading: boolean): void {
    this.loading[key] = loading;
    this.notify();
  }

  /**
   * Set search query
   */
  setSearchQuery(query: string): void {
    this.searchQuery = query;
    this.notify();
  }

  /**
   * Set search filters
   */
  setSearchFilters(filters: Record<string, unknown>): void {
    this.searchFilters = { ...filters };
    this.notify();
  }

  /**
   * Add selected broker
   */
  addSelectedBroker(id: number): void {
    if (!this.selectedBrokers.includes(id)) {
      this.selectedBrokers.push(id);
      this.notify();
    }
  }

  /**
   * Remove selected broker
   */
  removeSelectedBroker(id: number): void {
    const index = this.selectedBrokers.indexOf(id);
    if (index !== -1) {
      this.selectedBrokers.splice(index, 1);
      this.notify();
    }
  }

  /**
   * Clear selected brokers
   */
  clearSelectedBrokers(): void {
    this.selectedBrokers = [];
    this.notify();
  }

  /**
   * Set comparison mode
   */
  setComparisonMode(enabled: boolean): void {
    this.comparisonMode = enabled;
    if (!enabled) {
      this.clearSelectedBrokers();
    }
    this.notify();
  }

  /**
   * Reset store to initial state
   */
  reset(): void {
    this.theme = 'auto';
    this.sidebarOpen = false;
    this.modalOpen = false;
    this.modalContent = null;
    this.hideToast();
    this.loading = {
      global: false,
      brokers: false,
      search: false,
    };
    this.searchQuery = '';
    this.searchFilters = {};
    this.selectedBrokers = [];
    this.comparisonMode = false;
    this.notify();
  }

  /**
   * Get current state
   */
  getState(): UIState {
    return {
      theme: this.theme,
      sidebarOpen: this.sidebarOpen,
      modalOpen: this.modalOpen,
      modalContent: this.modalContent,
      toast: this.toast,
      loading: this.loading,
      searchQuery: this.searchQuery,
      searchFilters: this.searchFilters,
      selectedBrokers: this.selectedBrokers,
      comparisonMode: this.comparisonMode,
    };
  }

  /**
   * Check if broker is selected
   */
  isBrokerSelected(id: number): boolean {
    return this.selectedBrokers.includes(id);
  }

  /**
   * Toggle broker selection
   */
  toggleBrokerSelection(id: number): void {
    if (this.isBrokerSelected(id)) {
      this.removeSelectedBroker(id);
    } else {
      this.addSelectedBroker(id);
    }
  }

  /**
   * Get selected brokers count
   */
  getSelectedBrokersCount(): number {
    return this.selectedBrokers.length;
  }

  /**
   * Check if can add more brokers for comparison
   */
  canAddMoreBrokers(maxCount = 5): boolean {
    return this.selectedBrokers.length < maxCount;
  }
}

/**
 * Global UI store instance
 */
export const uiStore = new UIStore();
