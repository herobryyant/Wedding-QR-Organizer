package com.example.wedding.guest;

import com.example.wedding.security.AdminAuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.UUID;

import static com.example.wedding.guest.GuestDtos.*;

@RestController
@RequestMapping("/api")
public class GuestController {
    private final GuestRepository repository;
    private final AdminAuthService auth;
    public GuestController(GuestRepository repository, AdminAuthService auth) { this.repository = repository; this.auth = auth; }

    @GetMapping("/public/lookup")
    public List<GuestView> lookup(@RequestParam String name) {
        String query = name == null ? "" : name.trim();
        if (query.length() < 2 || query.length() > 80) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter at least 2 characters.");
        return repository.searchByName(query).stream().limit(20).map(GuestView::from).toList();
    }

    @PostMapping("/admin/login")
    public LoginResponse login(@Valid @RequestBody LoginInput input) { return new LoginResponse(auth.login(input.password()), "12 hours"); }

    @PostMapping("/admin/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@RequestHeader(value = "Authorization", required = false) String header) {
        auth.logout(header != null && header.startsWith("Bearer ") ? header.substring(7) : null);
    }

    @GetMapping("/admin/guests")
    public List<GuestView> guests() { return repository.findAllSorted().stream().map(GuestView::from).toList(); }

    @GetMapping("/admin/stats")
    public Stats stats() { return new Stats(repository.count(), repository.countTables()); }

    @PostMapping("/admin/guests")
    @ResponseStatus(HttpStatus.CREATED)
    public GuestView create(@Valid @RequestBody GuestInput input) { return GuestView.from(repository.save(new Guest(clean(input.name()), clean(input.tableName())))); }

    @PatchMapping("/admin/guests/{id}")
    public GuestView update(@PathVariable UUID id, @Valid @RequestBody GuestInput input) {
        Guest guest = repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Guest not found"));
        guest.update(clean(input.name()), clean(input.tableName()));
        return GuestView.from(repository.save(guest));
    }

    @DeleteMapping("/admin/guests/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) { if (!repository.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Guest not found"); repository.deleteById(id); }

    @PostMapping("/admin/guests/import")
    public ImportResponse importGuests(@Valid @RequestBody ImportInput input) {
        if (input.guests() == null || input.guests().isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The import file has no guest rows.");
        if (input.guests().size() > 2000) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Import up to 2,000 guests at a time.");
        List<Guest> guests = input.guests().stream().map(row -> new Guest(clean(row.name()), clean(row.tableName()))).toList();
        return new ImportResponse(repository.saveAll(guests).size());
    }

    private String clean(String value) { return value == null ? "" : value.trim().replaceAll("\\s+", " "); }
}
