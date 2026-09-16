import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { MoviesService } from './movies.service';

@Controller('api/v3/movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get('featured')
  async getFeatured() {
    const data = await this.moviesService.getFeaturedMovies();
    return data.movies;
  }

  @Get('genres')
  async getGenres() {
    return this.moviesService.syncGenres();
  }

  @Get('search')
  async search(@Query('q') q: string) {
    return this.moviesService.searchMovies(q);
  }

  @Get('discover')
  async discover(@Query('genre') genre: string) {
    return this.moviesService.getMoviesByGenre(genre);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const movie = await this.moviesService.getMovieDetails(id);
    if (!movie) {
      throw new NotFoundException(`Movie with ID or TMDB ID '${id}' not found`);
    }
    return movie;
  }
}
