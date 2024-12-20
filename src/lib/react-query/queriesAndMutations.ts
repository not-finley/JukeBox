import {
    useMutation,
    useQuery
} from '@tanstack/react-query'
import { createUserAccount, signInAccount, signOutAccount } from '../appwrite/api'
import { INewUser } from '@/types'
import { QUERY_KEYS } from './queryKeys'

export const useCreateUserAccount = () => {
    return useMutation({
        mutationFn: (user: INewUser) => createUserAccount(user),
    })
}

export const useSignInAccount = () => {
    return useMutation({
        mutationFn: (user: { email: string; password: string}) => signInAccount(user),
    })
}

export const useSignOutAccount = () => {
    return useMutation({
        mutationFn: signOutAccount
    })
}

// export const useGetRecentPosts = () => {
//     return useQuery({
//         queryKey: [QUERY_KEYS.GET_RECENT_SONGS]
//     })
// }

export const useGetSongById = (songId: string) => {
    return useQuery({
        queryKey: [QUERY_KEYS.GET_SONG_BY_ID]
    })
}