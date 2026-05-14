import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { changePassword, getUserProfile, updateUserProfile, uploadAvatar, type UserProfile } from "@/api/userApi";

export const profileQueryKey = ["user-profile"] as const;

export function useUserProfile(enabled: boolean = true) {
  return useQuery<UserProfile>({
    queryKey: profileQueryKey,
    queryFn: getUserProfile,
    staleTime: 60_000,
    enabled: enabled, // Only fetch if enabled (i.e., user is authenticated)
  });
}

export function useUpdateUserProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (data) => {
      qc.setQueryData(profileQueryKey, data);
    },
  });
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (data) => {
      qc.setQueryData(profileQueryKey, (prev: UserProfile | undefined) =>
        prev ? { ...prev, avatar_url: data.avatar_url } : prev
      );
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
  });
}

