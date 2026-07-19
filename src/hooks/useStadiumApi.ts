import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  Telemetry,
  Incident,
  Recommendation,
  Weather,
  Transportation,
  MissionControl,
} from "@/types/stadium";

export function useStadiumState() {
  const queryClient = useQueryClient();
  const [isWsConnected, setIsWsConnected] = useState(false);

  const query = useQuery<MissionControl>({
    queryKey: ["stadium-state"],
    queryFn: () => apiClient.get<MissionControl>("api/stadium/state"),
    refetchInterval: isWsConnected ? false : 5000, // Fallback to 5s polling if WS is offline
    staleTime: 5000,
  });

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const wsUrl = baseUrl.replace(/^http/, "ws") + "/api/stadium/ws";

    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;
    let shouldReconnect = true;

    function connect() {
      try {
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          setIsWsConnected(true);
        };

        socket.onmessage = (event) => {
          if (typeof event.data === "string" && event.data.startsWith("ping:")) {
            const parts = event.data.split(":");
            if (socket && socket.readyState === WebSocket.OPEN) {
              socket.send(`pong:${parts[1]}`);
            }
            return;
          }
          try {
            const state = JSON.parse(event.data);
            queryClient.setQueryData(["stadium-state"], state);
          } catch (e) {
            console.error("Error parsing WebSocket message:", e);
          }
        };

        socket.onclose = () => {
          setIsWsConnected(false);
          if (shouldReconnect) {
            reconnectTimeout = setTimeout(connect, 3000); // Reconnect loop
          }
        };

        socket.onerror = () => {
          setIsWsConnected(false);
        };
      } catch (err) {
        setIsWsConnected(false);
      }
    }

    connect();

    return () => {
      shouldReconnect = false;
      if (socket) socket.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [queryClient]);

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    isWsConnected,
  };
}

export function useMissionControl() {
  const { data, isLoading, error, refetch } = useStadiumState();
  return {
    data,
    isLoading,
    error,
    refetch,
  };
}

export function useTelemetry() {
  const { data, isLoading, error, refetch } = useStadiumState();
  return {
    data: data ? data.crowd : undefined,
    isLoading,
    error,
    refetch,
  };
}

export function useRecommendations(role: string = "organizer", phase?: string) {
  const queryClient = useQueryClient();
  const state = queryClient.getQueryData<MissionControl>(["stadium-state"]);
  const scenario = state?.scenario;

  useEffect(() => {
    if (scenario) {
      queryClient.invalidateQueries({ queryKey: ["recommendations", role, phase] });
    }
  }, [scenario, role, phase, queryClient]);

  const query = useQuery<Recommendation[]>({
    queryKey: ["recommendations", role, phase],
    queryFn: () => {
      const url = phase
        ? `api/recommendations?role=${role}&phase=${phase}`
        : `api/recommendations?role=${role}`;
      return apiClient.get<Recommendation[]>(url);
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useIncidents() {
  const { data, isLoading, error, refetch } = useStadiumState();
  return {
    data: data ? data.incidents : undefined,
    isLoading,
    error,
    refetch,
  };
}

export function useWeather() {
  const { data, isLoading, error, refetch } = useStadiumState();
  return {
    data: data ? data.weather : undefined,
    isLoading,
    error,
    refetch,
  };
}

export function useTransportation() {
  const { data, isLoading, error, refetch } = useStadiumState();
  return {
    data: data ? data.transportation : undefined,
    isLoading,
    error,
    refetch,
  };
}

export function useTriggerDemoEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (event: string) =>
      apiClient.post<MissionControl>("api/demo/event", { event }),
    onSuccess: (data) => {
      queryClient.setQueryData(["stadium-state"], data);
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    },
  });
}

export function usePauseSimulation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<{ is_paused: boolean }>("api/demo/pause"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stadium-state"] });
    }
  });
}

export function useResumeSimulation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<{ is_paused: boolean }>("api/demo/resume"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stadium-state"] });
    }
  });
}

export function useResetSimulation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<any>("api/demo/reset"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stadium-state"] });
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    }
  });
}

export function useToggleAutoMode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) =>
      apiClient.post<any>("api/demo/auto", { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stadium-state"] });
    }
  });
}

export function useAddIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { location: string; type: string; status: string; severity: string }) =>
      apiClient.post<Incident>("api/stadium/incidents", data),
    onSuccess: (data) => {
      queryClient.setQueryData(["stadium-state"], (prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          incidents: [data, ...(prev.incidents || [])],
        };
      });
    },
  });
}

export function useResolveIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post<any>(`api/stadium/incidents/${id}/resolve`),
    onSuccess: (_, id) => {
      queryClient.setQueryData(["stadium-state"], (prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          incidents: (prev.incidents || []).map((inc: any) =>
            inc.id === id ? { ...inc, status: "Resolved" } : inc
          ),
        };
      });
    },
  });
}

export function useToggleLock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { lock_key: string; status: boolean }) =>
      apiClient.post<any>("api/stadium/security/locks", data),
    onSuccess: (_, variables) => {
      queryClient.setQueryData(["stadium-state"], (prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          security: {
            ...prev.security,
            locks: {
              ...prev.security.locks,
              [variables.lock_key]: variables.status,
            },
          },
        };
      });
    },
  });
}

export function useToggleTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (task_id: string) =>
      apiClient.post<any>("api/stadium/volunteer/tasks/toggle", { task_id }),
    onSuccess: (_, task_id) => {
      queryClient.setQueryData(["stadium-state"], (prev: any) => {
        if (!prev) return prev;
        const nextTasks = (prev.volunteers.tasks || []).map((task: any) =>
          task.id === task_id ? { ...task, completed: !task.completed } : task
        );
        const completedCount = nextTasks.filter((t: any) => t.completed).length;
        return {
          ...prev,
          volunteers: {
            ...prev.volunteers,
            tasks: nextTasks,
            completed_tasks: completedCount,
          },
          volunteer: {
            ...prev.volunteer,
            tasks: nextTasks,
            completed_tasks: completedCount,
          },
        };
      });
    },
  });
}

export function useTogglePatrol() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patrol_id: string) =>
      apiClient.post<any>("api/stadium/security/patrols/toggle", { patrol_id }),
    onSuccess: (_, patrol_id) => {
      queryClient.setQueryData(["stadium-state"], (prev: any) => {
        if (!prev) return prev;
        const nextPatrols = (prev.security.patrols || []).map((patrol: any) =>
          patrol.id === patrol_id
            ? { ...patrol, status: patrol.status === "Checked" ? "Pending" : "Checked" }
            : patrol
        );
        return {
          ...prev,
          security: {
            ...prev.security,
            patrols: nextPatrols,
          },
        };
      });
    },
  });
}

export function useApproveProtocol() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<any>("api/stadium/organizer/approve-protocol"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stadium-state"] });
    },
  });
}

export function useVoiceCommand() {
  return useMutation({
    mutationFn: (data: { role: string; transcript: string }) =>
      apiClient.post<{ summary: string; priority: string; action: string; volunteers: string; resolution: string }>(
        "api/stadium/voice-command",
        data
      ),
  });
}
