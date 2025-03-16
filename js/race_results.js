function format_time(time){
    if(time === 'Not Finished'){
        return 'Not Finished'
    }
    time = Math.floor(time)
    hrs = Math.floor(time/(60*60))
    mins = Math.floor(time/(60))
    secs = time%60
    return `${hrs}h ${mins}m ${secs}s`

}

function calculateAge(birthday) {
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

function getDivision(age, gender) {
    let bracket;
    if (age < 18) bracket = "17/Un";
    else if (age < 25) bracket = "18-24";
    else if (age < 35) bracket = "25-34";
    else if (age < 40) bracket = "35-39";
    else if (age < 45) bracket = "40-44";
    else if (age < 50) bracket = "45-49";
    else if (age < 55) bracket = "50-54";
    else if (age < 60) bracket = "55-59";
    else if (age < 65) bracket = "60-64";
    else if (age < 70) bracket = "65-69";
    else if (age < 75) bracket = "70-74";
    else if (age < 80) bracket = "75-79";
    else bracket = "80+";
    return `${gender}${bracket}`;
}

function processRaceData(data) {
// const raceCategories = [...new Set(data.map(entry => entry.race))];
// const raceCategories = [ "500m","1000m", "1mile", "biath","" ]
const raceCategories = [ "500m","1000m", "1mile", "biath"]

return raceCategories.map(race => {
    let raceData = data.filter(entry => entry.race === race);

    // Compute age and division
    raceData = raceData.map(entry => ({
        ...entry,
        age: calculateAge(entry.birthday),
        division: getDivision(calculateAge(entry.birthday), entry.gender)
    }));

    // Separate valid and invalid times
    let validEntries = raceData.filter(entry => entry.swim_time !== "");
    let invalidEntries = raceData.filter(entry => entry.swim_time === "");

    // Sort valid entries by swim time (fastest to slowest)
    validEntries.sort((a, b) => a.swim_time - b.swim_time);

    // Assign overall placement for valid entries
    validEntries.forEach((entry, index) => entry.place = index + 1);

    // Assign last places to invalid entries
    invalidEntries.forEach((entry, index) => entry.place = validEntries.length + 1 + index);

    // Combine valid and invalid entries back
    raceData = [...validEntries, ...invalidEntries];

    // Female placement
    const femaleData = validEntries.filter(entry => entry.gender === "F");
    femaleData.forEach((entry, index) => entry.fem_place = index + 1);

    // Division placement with total count
    const divisionGroups = {};
    validEntries.forEach(entry => {
        if (!divisionGroups[entry.division]) {
            divisionGroups[entry.division] = [];
        }
        divisionGroups[entry.division].push(entry);
    });

    Object.values(divisionGroups).forEach(group => {
        group.sort((a, b) => a.swim_time - b.swim_time);
        const totalInDivision = group.length;
        group.forEach((entry, index) => entry.division_place = `${index + 1}/${totalInDivision}`);
    });

    // Assign "Not Finished" label for invalid swim times
    invalidEntries.forEach(entry => {
        entry.swim_time = "Not Finished";
        entry.fem_place = "-";
        entry.division_place = "-";
    });

    return { race, raceData };
});
}

function displayResults(data) {
    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = "";

    const processedData = processRaceData(data);

    processedData.forEach(({ race, raceData }) => {
        const tableContainer = document.createElement("div");
        tableContainer.classList.add("table-container");
        // if(race ===""){
        //     race = "Did not compete"
        // }
        // if(entry.ws === 'NWS'){
        //     entry.ws = 'X'

        // }
        // else{
        //     entry.ws = ''
        // }

        const tableHTML = `
            <h2>${race}</h2>
            <table>
                <thead>
                    <tr>
                        <th>Place</th>
                        <th>Name</th>
                        <th>Bib #</th>
                        <th>Time (s)</th>
                        <th>Age</th>
                        <th>Gender</th>
                        <th>Division</th>
                        <th>Div. Place</th>
                        <th>Fem Place</th>
                        <th>NWS</th>
                    </tr>
                </thead>
                <tbody>
                    ${raceData.map(entry => `
                        <tr>
                            <td>${entry.swim_time === 'Not Finished' ? '-': entry.place}</td>
                            <td>${entry.name}</td>
                            <td>${entry.bib_num}</td>
                            <td>${format_time(entry.swim_time)}</td>
                            <td>${entry.age}</td>
                            <td>${entry.gender}</td>
                            <td>${entry.division}</td>
                            <td>${entry.division_place}</td>
                            <td>${entry.gender === "F" ? entry.fem_place : "-"}</td>
                            <td>${entry.ws ==='NWS' ? 'X': ''}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `;

        tableContainer.innerHTML = tableHTML;
        resultsContainer.appendChild(tableContainer);
    });
}