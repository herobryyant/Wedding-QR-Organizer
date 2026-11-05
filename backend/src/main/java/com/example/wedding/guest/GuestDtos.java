package com.example.wedding.guest;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;

public final class GuestDtos {
    private GuestDtos() {}
    public record GuestInput(@NotBlank @Size(max = 120) String name, @NotBlank @Size(max = 80) String tableName) {}
    public record GuestView(UUID id, String name, String tableName, Instant updatedAt) {
        public static GuestView from(Guest guest) { return new GuestView(guest.getId(), guest.getName(), guest.getTableName(), guest.getUpdatedAt()); }
    }
    public record LoginInput(@NotBlank String password) {}
    public record LoginResponse(String token, String expiresIn) {}
    public record ImportInput(@NotEmpty @Size(max = 2000) java.util.List<@Valid GuestInput> guests) {}
    public record ImportResponse(int imported) {}
    public record Stats(long guests, long tables) {}
}
