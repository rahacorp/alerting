export interface Action {
    name: string
    act(obj: any)
}