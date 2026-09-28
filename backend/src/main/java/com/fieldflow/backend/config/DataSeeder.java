package com.fieldflow.backend.config;

import com.fieldflow.backend.entity.*;
import com.fieldflow.backend.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedData(UsuarioRepository usuarioRepository,
                               ClienteRepository clienteRepository,
                               SedeRepository sedeRepository,
                               EquipoRepository equipoRepository,
                               TecnicoRepository tecnicoRepository,
                               OrdenTrabajoRepository ordenRepository,
                               ProductoRepository productoRepository,
                               TareaMantenimientoRepository tareaMantenimientoRepository,
                               FallaRecurrenteRepository fallaRecurrenteRepository,
                               ChecklistRepository checklistRepository,
                               PasswordEncoder passwordEncoder) {
        return args -> {
            // Backfill idempotente: vincular usuarios TECNICO sin tecnico a tecnicos libres (por id).
            // Cubre BDs ya sembradas antes de existir la columna tecnico_id.
            List<Usuario> usuarios = usuarioRepository.findAll();
            if (!usuarios.isEmpty()) {
                List<Tecnico> tecnicos = tecnicoRepository.findAll();
                tecnicos.sort((a, b) -> a.getId().compareTo(b.getId()));
                java.util.Set<Long> vinculados = new java.util.HashSet<>();
                for (Usuario u : usuarios) {
                    if (u.getTecnico() != null) {
                        vinculados.add(u.getTecnico().getId());
                    }
                }
                for (Usuario u : usuarios) {
                    if (u.getRole() == Usuario.Rol.TECNICO && u.getTecnico() == null) {
                        Tecnico libre = tecnicos.stream()
                                .filter(t -> !vinculados.contains(t.getId()))
                                .findFirst().orElse(null);
                        if (libre != null) {
                            u.setTecnico(libre);
                            usuarioRepository.save(u);
                            vinculados.add(libre.getId());
                        }
                    }
                }
            }

            if (usuarioRepository.count() > 0) {
                return;
            }

            usuarioRepository.save(new Usuario("admin", passwordEncoder.encode("admin123"), Usuario.Rol.ADMIN));
            usuarioRepository.save(new Usuario("superadmin", passwordEncoder.encode("super123"), Usuario.Rol.SUPER_ADMIN));

            Cliente c1 = new Cliente("GasSolutions S.A.S", "900123456");
            Cliente c2 = new Cliente("Centro Comercial Andino", "800987654");
            clienteRepository.saveAll(List.of(c1, c2));

            Sede s1 = new Sede("Planta Principal", "Cra 7 # 72-64", "Bogota", c1);
            Sede s2 = new Sede("Sede Norte", "Cl 93 # 14-20", "Bogota", c2);
            sedeRepository.saveAll(List.of(s1, s2));

            Equipo e1 = new Equipo("CAL-001", "Caldera Industrial", "Caldera",
                    LocalDate.of(2026, 7, 15), s1);
            Equipo e2 = new Equipo("EST-005", "Estufa Lab", "Gasodomestico",
                    LocalDate.of(2026, 8, 10), s1);
            equipoRepository.saveAll(List.of(e1, e2));

            Tecnico t1 = new Tecnico("Eduin - Senior Gas", Set.of("Gas", "Caldera"));
            Tecnico t2 = new Tecnico("Carlos - Mantenimiento", Set.of("Preventivo"));
            tecnicoRepository.saveAll(List.of(t1, t2));

            // Vincular usuarios tecnicos con su ficha de tecnico
            Usuario u1 = new Usuario("tecnico1", passwordEncoder.encode("tecnico123"), Usuario.Rol.TECNICO);
            u1.setTecnico(t1);
            Usuario u2 = new Usuario("tecnico2", passwordEncoder.encode("tecnico123"), Usuario.Rol.TECNICO);
            u2.setTecnico(t2);
            usuarioRepository.saveAll(List.of(u1, u2));

            Producto p1 = new Producto("PRD-CAL", "Caldera Industrial", "Caldera", "Navien", "NPE-240A");
            Producto p2 = new Producto("PRD-EST", "Estufa de Laboratorio", "Gasodomestico", "Whirlpool", "SF-150");
            Producto p3 = new Producto("PRD-HOR", "Horno Industrial", "Horneado", "Blodgett", "XT-61");
            productoRepository.saveAll(List.of(p1, p2, p3));

            TareaMantenimiento tm1 = new TareaMantenimiento(p1, "Revision de presion y valvula",
                    "Verificar presion de trabajo, purga y valvula de seguridad", 3, 10);
            TareaMantenimiento tm2 = new TareaMantenimiento(p1, "Mantenimiento quemador",
                    "Limpieza de quemador, filtro y analisis de combustion", 6, 15);
            TareaMantenimiento tm3 = new TareaMantenimiento(p2, "Calibracion termostato",
                    "Verificar sonda de temperatura y calibracion", 6, 7);
            tareaMantenimientoRepository.saveAll(List.of(tm1, tm2, tm3));

            FallaRecurrente f1 = new FallaRecurrente(p1, "No enciende el quemador",
                    "El Piloto no enciende; la combusion no arranca", 6);
            FallaRecurrente f2 = new FallaRecurrente(p1, "Perdida de presion",
                    "La presion baja por purga o valvula de seguridad", 4);
            FallaRecurrente f3 = new FallaRecurrente(p2, "No calibra temperatura",
                    "El termostato no llega a la temperatura configurada", 3);
            fallaRecurrenteRepository.saveAll(List.of(f1, f2, f3));

            CheckItem medirCO = new CheckItem("Medir CO", false);
            medirCO.setTipo("NUMERICO");
            medirCO.setUnidad("ppm");
            Checklist chk = new Checklist("CHK-CAL-01", "Checklist Caldera",
                    "Caldera Industrial",
                    List.of(new CheckItem("Revisar presion", false),
                            new CheckItem("Revisar valvula de seguridad", false),
                            medirCO));
            checklistRepository.save(chk);

            OrdenTrabajo ot = new OrdenTrabajo(
                    "OT-1001", "Mantenimiento Preventivo", OrdenTrabajo.EstadoOT.asignada,
                    LocalDateTime.now().minusDays(1), LocalDate.now(),
                    "Revision periodica de caldera, valvula y presion",
                    c1, s1, e1, t1,
                    OrdenTrabajo.Prioridad.media, 120);
            CheckItem medirCOot = new CheckItem("Medir CO", false);
            medirCOot.setTipo("NUMERICO");
            medirCOot.setUnidad("ppm");
            ot.setChecklist(List.of(
                    new CheckItem("Revisar presion", false),
                    new CheckItem("Revisar valvula de seguridad", false),
                    medirCOot));
            ot.setHistorial(List.of("OT creada y asignada a tecnico"));
            ordenRepository.save(ot);
        };
    }
}