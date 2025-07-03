#pragma warning disable SKEXP0110

using Microsoft.AspNetCore.SignalR;

namespace Backend.Hubs;

public class RaceHub : Hub
{
    public async Task JoinRace(string sessionId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"race_{sessionId}");
        await Clients.Group($"race_{sessionId}").SendAsync("PlayerJoined", Context.ConnectionId);
    }

    public async Task LeaveRace(string sessionId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"race_{sessionId}");
        await Clients.Group($"race_{sessionId}").SendAsync("PlayerLeft", Context.ConnectionId);
    }

    public async Task UpdatePosition(string sessionId, double x, double y, double rotation)
    {
        await Clients.Group($"race_{sessionId}").SendAsync("PositionUpdate", Context.ConnectionId, x, y, rotation);
    }

    public async Task CheckpointReached(string sessionId, int checkpointIndex)
    {
        await Clients.Group($"race_{sessionId}").SendAsync("CheckpointReached", Context.ConnectionId, checkpointIndex);
    }

    public async Task RaceCompleted(string sessionId, int finalTime)
    {
        await Clients.Group($"race_{sessionId}").SendAsync("RaceCompleted", Context.ConnectionId, finalTime);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // Clean up any race groups this connection was part of
        await base.OnDisconnectedAsync(exception);
    }
} 