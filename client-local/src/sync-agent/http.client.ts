import axios, { AxiosInstance } from 'axios';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SyncHttpClient {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.HUB_BASE_URL,
      timeout: 15_000,
    });
  }

  post<T = unknown>(url: string, data?: unknown) {
    return this.client.post<T>(url, data).then((res) => res.data);
  }

  get<T = unknown>(url: string, params?: Record<string, unknown>) {
    return this.client.get<T>(url, { params }).then((res) => res.data);
  }
}
