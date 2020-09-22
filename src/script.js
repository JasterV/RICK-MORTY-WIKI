var ENDPOINT = "https://rickandmortyapi.com/api/";

var controller = {
    next: null,
    episodes: {},
    characters: {},
    locations: {},
}

$(function () {
    axios.get(ENDPOINT).then(function (result) {
        var routes = result.data;
        controller.next = routes.episodes;
        loadNextPage().then(function () {
            showEpisode(1);
        });
    });
    /* EVENT LISTENERS */
    $("#load-more").click(loadNextPage);

    $(".episodes").on("click", "li", function (e) {
        var episode = $(e.target).attr("data-episode");
        var mainId = $('[role="main"]').attr("id");
        if ("episode-" + episode != mainId)
            showEpisode(episode);
    });

    $('[role="main"]').on("click", ".character-card", function (e) {
        var id = $(e.currentTarget).attr("data-character");
        showCharacter(id);
    });


    $('[role="main"]').on("click", ".episode-card", function (e) {
        var id = $(e.currentTarget).attr("data-episode");
        showEpisode(id);
    });


    $('[role="main"]').on("click", ".morty-btn", function (e) {
        var characterId = $(e.target).closest('[role="main"]').attr("id");
        characterId = characterId.split("-")[1];
        showLocation(characterId);
    });
});

/* LOAD FUNCTIONS */

function loadNextPage() {
    if (controller.next == null) return;
    return getData(controller.next).then(function (page) {
        controller.next = page.info.next;
        page.results.forEach(function (episode) {
            controller.episodes[episode.id] = episode;
            $(".episodes").append($('<li data-episode="' + episode.id + '">Episode ' + episode.id + '</li>'))
        });
    });
}

function loadAll(urls, type) {
    var storage = controller[type];
    getAllData(urls, storage).then(function (data) {
        data.forEach(function (elem) {
            storage[elem.id] = elem;
            $(".cards-list").append(createCard(elem, type));
        });
    });
}

/* SHOW TYPE FUNCTIONS */

function showEpisode(id) {
    var episode = controller.episodes[id];
    $('[role="main"]').empty();
    $('[role="main"]').append(createTemplate(episode, "episode"));
    $('[role="main"]').attr("id", "episode-" + episode.id);
    loadAll(episode.characters, "characters");
}

function showCharacter(id) {
    var character = controller.characters[id];
    $('[role="main"]').empty();
    $('[role="main"]').attr("id", "character-" + id);
    $('[role="main"]').append(createTemplate(character, "character"));
    loadAll(character.episode, "episodes");
}

function showLocation(characterId) {
    var character = controller.characters[characterId];
    var originUrl = character.origin.url;
    var originId = getIdFromURL(originUrl);
    $('[role="main"]').empty();
    $('[role="main"]').attr("id", "location-" + originId);
    if (originId in controller.locations) {
        var origin = controller.locations[originId];
        $('[role="main"]').append(createTemplate(origin, "location"));
        loadAll(origin.residents, "characters")
    } else {
        getData(originUrl).then(function (location) {
            controller.locations[location.id] = location;
            $('[role="main"]').append(createTemplate(location, "location"));
            loadAll(location.residents, "characters")
        });
    }
}

/** TEMPLATES  */

function createTemplate(elem, type) {
    if (type == "character")
        return createCharacterTemplate(elem);
    else if (type == "episode")
        return createEpisodeTemplate(elem);
    else if (type == "location")
        return createLocationTemplate(elem);
    return $("");
}

function createLocationTemplate(location) {
    return $("<h1>" + location.name + "</h1>" +
        "<p class=\"subtitle\"> " + location.type + " <strong>" + location.dimension + "</strong></p>" +
        "<div class=\"cards-list\"></div>");
}

function createCharacterTemplate(character) {
    return $(`<div class="character-header">
                    <img src="${character.image}"/>
                    <div class="character-info">
                        <h1>${character.name}</h1>
                        <p>${character.species} <strong>|</strong> ${character.status} <strong>|</strong> ${character.gender} <strong>|</strong> ${character.origin.name}</p>
                        <button class="morty-btn">Location</button>
                    </div>
                </div>
                <div class="cards-list"></div>
            `);
}

function createEpisodeTemplate(episode) {
    return $("<h1>" + episode.name + "</h1>" +
        "<p class=\"subtitle\"> " + episode.air_date + " <strong>" + episode.episode + "</strong></p>" +
        "<div class=\"cards-list\"></div>");
}

/** CARDS */

function createCard(elem, type) {
    if (type == "characters")
        return createCharacterCard(elem);
    else if (type == "episodes")
        return createEpisodeCard(elem);
    return $("");
}

function createCharacterCard(character) {
    return $("<div class=\"character-card\" data-character=\"" + character.id + "\"><img src=\"" + character.image +
        "\"/><h3>" + character.name + "</h3><p>" +
        character.species + " <strong>| " +
        character.status + "</strong></p> </div>");
}

function createEpisodeCard(episode) {
    return $(`<div class="episode-card" data-episode="${episode.id}">
                <h2><strong>${episode.name}</strong></h2>
                <p>${episode.episode}</p>
                </div>`);
}

/* AJAX FUNCTIONS */

function getData(url) {
    return axios.get(url).then(function (result) {
        return result.data;
    });
}

function getAll(arr) {
    return axios.all(
        arr.map(function (url) {
            return getData(url);
        })
    );
}

function getAllData(urls, storage) {
    var visiteds = [],
        nVisiteds = [];
    for (var i = 0; i < urls.length; i++) {
        var id = getIdFromURL(urls[i]);
        if (id in storage)
            visiteds.push(storage[id]);
        else
            nVisiteds.push(urls[i]);
    }
    return getAll(nVisiteds).then(function (data) {
        return visiteds.concat(data);
    });
}

/** UTIL FUNCTIONS */

function getIdFromURL(url) {
    var splited = url.split('/');
    var id = splited[splited.length - 1];
    return id;
}