import apiClient from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";

const unwrap = (response) => response?.data ?? response;

const deviceActions = {
  approve: endpoints.employees.approveDevice,
  reject: endpoints.employees.rejectDevice,
  block: endpoints.employees.blockDevice,
};

export const employeesService = {
  async list() {
    return unwrap(await apiClient.get(endpoints.employees.list, { params: { pageSize: 100 } }));
  },
  async create(data) {
    return unwrap(await apiClient.post(endpoints.employees.create, data));
  },
  async update(employeeId, data) {
    return unwrap(await apiClient.put(endpoints.employees.byId(employeeId), data));
  },
  async details(employeeId) {
    return unwrap(await apiClient.get(endpoints.employees.byId(employeeId)));
  },
  async listDevices(employeeId) {
    return unwrap(await apiClient.get(endpoints.employees.devices(employeeId)));
  },
  async reviewDevice(employeeId, deviceId, action) {
    const makeEndpoint = deviceActions[action];
    if (!makeEndpoint) throw new Error("إجراء الجهاز غير مدعوم");
    return unwrap(await apiClient.put(makeEndpoint(employeeId, deviceId)));
  },
  async savePageAccess(employeeId, pages) {
    return unwrap(await apiClient.put(endpoints.employees.pageAccess(employeeId), { pages }));
  },
};
