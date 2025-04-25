import type { AxiosResponse } from 'axios';

export class DataWrapper<T> {
    fetched = false;
    fetching = false;
    error = false;
    data: T | null = null;

    setFetching(fetching?: boolean) {
        this.fetching = fetching ?? true;
    }

    setData(data: T) {
        this.fetched = true;
        this.fetching = false;
        this.error = false;
        this.data = data;
    }

    setError(error?: AxiosResponse) {
        this.fetched = true;
        this.fetching = false;
        this.error = true;
        this.data = null;
    }

    clear() {
        this.fetched = false;
        this.fetching = false;
        this.error = false;
        this.data = null;
    }
}
