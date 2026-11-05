package com.example.wedding.guest;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface GuestRepository extends JpaRepository<Guest, UUID> {
    @Query("select g from Guest g where lower(g.name) like lower(concat('%', :query, '%')) order by lower(g.name)")
    List<Guest> searchByName(@Param("query") String query);
    @Query("select g from Guest g order by lower(g.tableName), lower(g.name)")
    List<Guest> findAllSorted();
    @Query("select count(distinct g.tableName) from Guest g")
    long countTables();
}
