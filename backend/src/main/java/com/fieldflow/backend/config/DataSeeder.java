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
                               PasswordEncoder passwordEncoder) {
        return args -> {
            if (usuarioRepository.count() > 0) {
                return;
            }

            usuarioRepository.save(new Usuario("admin", passwordEncoder.encode("admin123"), Usuario.Rol.ADMIN));
            usuarioRepository.save(new Usuario("tecnico1", passwordEncoder.encode("tecnico123"), Usuario.Rol.TECNICO));
            usuarioRepository.save(new Usuario("tecnico2", passwordEncoder.encode("tecnico123"), Usuario.Rol.TECNICO));

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

            OrdenTrabajo ot = new OrdenTrabajo(
                    "OT-1001", "Mantenimiento Preventivo", OrdenTrabajo.EstadoOT.asignada,
                    LocalDateTime.now().minusDays(1), LocalDate.now(),
                    "Revision periodica de caldera, valvula y presion",
                    c1, s1, e1, t1,
                    OrdenTrabajo.Prioridad.media, 120);
            ot.setChecklist(List.of(
                    new CheckItem("Revisar presion", false),
                    new CheckItem("Revisar valvula de seguridad", false),
                    new CheckItem("Medir CO", false)));
            ot.setHistorial(List.of("OT creada y asignada a tecnico"));
            ordenRepository.save(ot);
        };
    }
}