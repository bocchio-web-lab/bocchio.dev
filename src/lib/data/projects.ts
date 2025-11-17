export const projects = [
    {
        slug: 'autonomous-ferrari',
        name: 'Autonomous RC Ferrari',
        year: 2024,
        image: 'https://avatars.githubusercontent.com/u/67842431',
        description:
            'A ROS-based autonomous RC car platform with modular perception, planning, and control subsystems.',
        readme_html: '<p>Full project description here...</p>'
    },
    {
        slug: 'hybrid-gripper',
        name: 'Hybrid Gripper System',
        year: 2023,
        image: 'https://avatars.githubusercontent.com/u/67842431',
        description:
            'A hybrid suction–finger gripper capable of handling varied objects for regrasp planning experiments.',
        readme_html: '<p>Additional details here...</p>'
    },
    {
        slug: 'autonomous-ferrari',
        name: 'Autonomous RC Ferrari',
        year: 2024,
        image: 'https://avatars.githubusercontent.com/u/67842431',
        description:
            'A ROS-based autonomous RC car platform with modular perception, planning, and control subsystems.',
        readme_html: '<p>Full project description here...</p>'
    },
    {
        slug: 'hybrid-gripper',
        name: 'Hybrid Gripper System',
        year: 2023,
        image: 'https://avatars.githubusercontent.com/u/67842431',
        description:
            'A hybrid suction–finger gripper capable of handling varied objects for regrasp planning experiments.',
        readme_html: '<p>Additional details here...</p>'
    },
    {
        slug: 'laser-thermal-simulation',
        name: 'Thermal Modeling of Advanced Manufacturing Processes',
        year: 2022,
        // image: 'https://github.com/bocchio-academic-projects/059168-Advanced-Manufacturing-Process-B/blob/master/img/1D_temperature_profile.png?raw=true',
        image: 'https://github.com/bocchio-academic-projects/059168-Advanced-Manufacturing-Process-B/blob/master/img/XY_temperature_profile.png?raw=true',
        description: 'This project develops MATLAB-based 1D and 3D thermal models to simulate laser-material interactions in advanced manufacturing. It predicts temperature distribution, aiding in the optimization of processes such as laser ablation.',
        readme_html: `
            <h3>Overview</h3>
            <p>This project explores the thermal dynamics of laser-based manufacturing through computational simulation. Implemented in MATLAB, it aims to predict temperature distribution within a material under laser irradiation, providing insights to optimize processes like precision ablation.</p>
            <p>The approach uses two distinct models. A one-dimensional (1D) model simulates a stationary planar heat source, calculating temperature (<em>T</em>) based on depth (<em>x</em>) and time (<em>t</em>) using the solution to the heat equation for a semi-infinite body:</p>
            <p><em>T(x, t) = T<sub>i</sub> + (q &middot; sqrt(4 &alpha; t) / k) &middot; ierfc(x / sqrt(4 &alpha; t))</em></p>
            <p>Here, <em>q</em> is the surface heat flux, <em>k</em> is thermal conductivity, and <em>&alpha;</em> is thermal diffusivity.</p>
            <p>A more advanced three-dimensional (3D) model simulates a moving point source, representing a scanning laser. It uses Rosenthal's solution to determine the steady-state temperature field from laser power (<em>P</em>) and scanning velocity (<em>v</em>):</p>
            <p><em>T(x, y, z) = T<sub>i</sub> + (P &alpha; / 2 &pi; k r) &middot; exp(-v (x + r) / 2 &alpha;)</em></p>
            <p>In this equation, <em>r</em> is the distance from the heat source and <em>&alpha;</em> is the thermal diffusivity (or absorption coefficient as context dictates). By visualizing the resulting heat-affected zones and melt pools, these models allow for tuning of laser parameters to achieve desired manufacturing outcomes with high precision.</p>
        `
        //         readme_html: `
        //         <h3>Project Overview</h3>
        // <p>Advanced manufacturing processes, particularly those involving lasers such as Selective Laser Melting (SLM), laser welding, and precision ablation, are fundamentally governed by complex thermal phenomena. The interaction between a high-energy laser beam and a material occurs over extremely short timescales and within a very small volume, leading to rapid heating, melting, and potential vaporization. The resulting thermal cycles dictate the material's final microstructure, mechanical properties, and geometric accuracy. Uncontrolled thermal behavior can lead to defects like cracking, unwanted residual stresses, and poor surface finish. Therefore, the ability to predict and understand the temperature distribution during these processes is of paramount importance for process control, optimization, and quality assurance.</p>
        // <p>This project addresses this challenge by developing a suite of computational models in MATLAB to simulate the thermal response of a material subjected to laser irradiation. The primary objective is to create a predictive framework that connects key process parameters—such as laser power, scanning speed, and beam properties—to physical outcomes like melt pool dimensions, heat-affected zone (HAZ) size, and heating/cooling rates. By providing a window into these complex, transient phenomena, the simulations serve as a powerful tool for engineers to design and optimize manufacturing processes, reducing the reliance on costly and time-consuming trial-and-error experimentation.</p>
        // <h3>Modeling Methodology</h3>
        // <p>The project employs two distinct modeling approaches to balance computational simplicity with physical accuracy, each suited for different scenarios and analytical goals.</p>
        // <h4>1. One-Dimensional (1D) Thermal Model</h4>
        // <p>The 1D model provides a simplified yet fundamental analysis of heat penetration into the material. It assumes the laser is a stationary, uniform planar heat source applied to the surface of a semi-infinite body. This approach is particularly useful for understanding the initial heating phase and the depth of thermal effects when the laser spot size is much larger than the region of interest. The simulation focuses exclusively on heat conduction along a single axis (depth), providing a clear view of how heat diffuses into the bulk material over time. Material properties, such as thermal conductivity and diffusivity, are treated as constants and are sourced from an external spreadsheet (<code>Thermal-Properties.xlsx</code>), allowing the model to be easily adapted for different substances.</p>
        // <h4>2. Three-Dimensional (3D) Moving Point Source Model</h4>
        // <p>For processes involving a scanning laser, a more sophisticated model is required. The 3D model simulates the temperature field created by a concentrated heat source moving at a constant velocity across the material's surface. This is far more representative of processes like laser welding, cutting, and ablation, where the interaction is highly localized and dynamic. This model allows for the exploration of the three-dimensional nature of the heat flow and the characteristic quasi-steady-state temperature distribution that forms around the moving source. The insights from this model are critical for predicting the geometry of the melt pool and the track width, which are essential for tasks like creating a PCB circuit via laser ablation.</p>
        // <h3>Mathematical Framework</h3>
        // <h4>1D Model Equation</h4>
        // <p>The temperature <em>T</em> at a given depth <em>x</em> and time <em>t</em> in the 1D model is governed by the solution for a semi-infinite solid with a constant surface heat flux <em>q</em>:</p>
        // <p><em>T(x, t) = T<sub>i</sub> + (q &middot; sqrt(4 &alpha; t) / k) &middot; ierfc(x / sqrt(4 &alpha; t))</em></p>
        // <p>Here, <em>T<sub>i</sub></em> represents the initial uniform temperature of the material. The term <em>q</em> is the absorbed heat flux from the laser at the surface (in W/m²). The material's properties are defined by its thermal conductivity <em>k</em> and its thermal diffusivity <em>&alpha;</em>. The <em>ierfc</em> function is the inverse complementary error function, which describes the diffusion of heat into the material.</p>
        // <h4>3D Model Equation (Rosenthal's Solution)</h4>
        // <p>The 3D model employs Rosenthal's solution for a moving point heat source in a quasi-steady state. The temperature <em>T</em> at a coordinate (<em>x, y, z</em>) in a reference frame moving with the laser is given by:</p>
        // <p><em>T(x, y, z) = T<sub>i</sub> + (P &alpha; / 2 &pi; k r) &middot; exp(-v (x + r) / 2 &alpha;)</em></p>
        // <p>Here, <em>P</em> is the total laser power (Watts), <em>&alpha;</em> is the material's absorption coefficient, and <em>r</em> represents the radial distance from the point source: <em>r = sqrt(x² + y² + z²)</em>. The exponential term includes the scanning velocity <em>v</em>, producing a non-symmetrical temperature distribution with compressed isotherms ahead of the moving source and elongated tails behind it.</p>
        // <h3>Analysis, Results, and Applications</h3>
        // <p>The output of these models provides rich, quantitative data for process analysis. The 1D model generates plots of temperature versus depth and temperature versus time, illustrating how quickly the surface heats up and how the heat penetrates the subsurface. This is crucial for processes where the depth of the heat-affected zone must be carefully controlled.</p>
        // <p>The 3D model's results are even more insightful for practical applications. By plotting the isotherms (contours of constant temperature), one can visualize the precise shape and size of the melt pool (the region above the material's melting temperature) and the vaporized zone (the region above the boiling point). By tuning the laser power <em>P</em> and scanning speed <em>v</em> in the simulation, it was possible to find an optimal parameter set that maximized the ablation rate without causing excessive thermal damage to the surrounding material.</p>
        // <p>Ultimately, these simulations act as a virtual laboratory. They enable rapid sensitivity analysis, allowing engineers to ask questions like, "How does doubling the scan speed affect the melt pool depth?" or "What is the minimum power required to achieve vaporization?" This predictive capability significantly accelerates the process development cycle and provides a deep, physics-based understanding that is essential for mastering advanced manufacturing technologies.</p>`
    }

];