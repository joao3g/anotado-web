import * as botsService from "../api/services/bots.service";

export const botsStatusQuery = () => ({
    queryKey: ['bots-status'],
    queryFn: async () => botsService.getStatus(),
});
