import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { employeesService } from "../services/employeesService";

export function useEmployeeDetails(employeeId) {
  return useQuery({
    queryKey: ["employee", employeeId],
    queryFn: async () => {
      const [employee, devices] = await Promise.all([
        employeesService.details(employeeId),
        employeesService.listDevices(employeeId),
      ]);
      return {
        ...employee,
        devices: Array.isArray(devices) ? devices : devices?.data || [],
        pageAccess: employee.pageAccess || [],
        attendanceRecords: employee.attendanceRecords || [],
        auditLogs: employee.auditLogs || [],
      };
    },
    enabled: Boolean(employeeId),
  });
}

function useEmployeeMutation(employeeId, mutationFn, options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ["employee", employeeId] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      options.onSuccess?.(...args);
    },
  });
}

export function useUpdateEmployee(employeeId, options) {
  return useEmployeeMutation(employeeId, (data) => employeesService.update(employeeId, data), options);
}

export function useReviewEmployeeDevice(employeeId, options) {
  return useEmployeeMutation(
    employeeId,
    ({ deviceId, action }) => employeesService.reviewDevice(employeeId, deviceId, action),
    options,
  );
}

export function useSaveEmployeeAccess(employeeId, options) {
  return useEmployeeMutation(
    employeeId,
    (pages) => employeesService.savePageAccess(employeeId, pages),
    options,
  );
}
