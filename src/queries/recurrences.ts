import * as recurrenceService from "../api/services/recurrence.service";
import { queryClient } from "../Routes";

export const recurrencesQuery = () => ({
    queryKey: ['recurrences'],
    queryFn: async () => recurrenceService.listRecurrences(),
});

// A series creates, changes, or removes installments in many months:
// refresh the list and every month of Saídas and the Dashboard.
export const invalidateAfterRecurrenceChange = async () => {
    await Promise.all([
        queryClient.invalidateQueries({ queryKey: recurrencesQuery().queryKey }),
        queryClient.invalidateQueries({ queryKey: ['expenses'] }),
        queryClient.invalidateQueries({ queryKey: ['expensesSummarized'] })
    ]);
}
