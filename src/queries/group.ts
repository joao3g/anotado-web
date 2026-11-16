import * as groupService from "../api/services/group.service";

export const familyQuery = () => ({
    queryKey: ['family'],
    queryFn: async () => groupService.getFamily(),
});
